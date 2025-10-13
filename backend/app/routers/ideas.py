from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..schemas.idea import IdeaRead, GameSession, IdeaViewCreate, FinalIdeaRequest, FinalIdeaResponse
from ..crud.idea import get_ideas_for_user, mark_idea_as_viewed, get_user_unseen_ideas
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
# асинхронная постановка задачи без блокировки
from ..tasks.idea_generator import run_sync_generation

router = APIRouter()


@router.post("/generate-pool")
async def generate_idea_pool(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Запускает генерацию пула идей для пользователя (после выбора доменов)"""
    
    if not current_user.selected_domains:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must select domains first via /auth/domains"
        )
    
    if not current_user.onboarding_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must complete onboarding first"
        )
    
    # Планируем генерацию: используем синхронную версию
    background_tasks.add_task(
        run_sync_generation,
        db_session=db,
        domains=current_user.selected_domains,
        ideas_per_domain=10,
    )
    
    return {
        "status": "started",
        "message": f"Generating ideas for domains: {', '.join(current_user.selected_domains)}",
        "domains": current_user.selected_domains,
        "estimated_ideas": len(current_user.selected_domains) * 10
    }


@router.get("/game-session", response_model=GameSession)
def get_game_session(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получает сессию игры - пачку идей для свайпов"""
    
    if not current_user.onboarding_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complete onboarding first"
        )
    
    # Получаем непросмотренные идеи из доменов пользователя
    ideas = get_user_unseen_ideas(db, current_user.id, current_user.selected_domains, limit)
    
    # Если идей мало, автоматически генерируем новые
    if len(ideas) < limit // 2:  # Если меньше половины от запрошенного
        # Запускаем генерацию в фоне
        run_sync_generation(
            db_session=db,
            domains=current_user.selected_domains,
            ideas_per_domain=5,  # Генерируем по 5 идей на домен
        )
        
        # Пытаемся получить больше идей после генерации
        ideas = get_user_unseen_ideas(db, current_user.id, current_user.selected_domains, limit)
    
    if not ideas:
        return GameSession(
            ideas=[],
            session_id=str(uuid.uuid4()),
            total_available=0
        )
    
    # Отмечаем идеи как просмотренные
    for idea in ideas:
        mark_idea_as_viewed(db, current_user.id, idea.id)
    
    return GameSession(
        ideas=[IdeaRead.model_validate(idea) for idea in ideas],
        session_id=str(uuid.uuid4()),
        total_available=len(ideas)
    )


@router.get("/", response_model=List[IdeaRead])
def get_ideas(
    skip: int = 0,
    limit: int = 20,
    domain: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получает все идеи пользователя (для админских целей)"""
    
    ideas = get_ideas_for_user(
        db, 
        user_domains=current_user.selected_domains or [],
        skip=skip,
        limit=limit,
        domain_filter=domain
    )
    
    return [IdeaRead.model_validate(idea) for idea in ideas]


@router.get("/stats")
def get_user_idea_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Статистика идей для пользователя"""
    
    from ..models import Idea, IdeaView, Swipe
    
    if not current_user.selected_domains:
        return {
            "total_available": 0,
            "viewed": 0,
            "swiped": 0,
            "liked": 0,
            "remaining": 0
        }
    
    # Общее количество идей в доменах пользователя
    total_available = db.query(Idea).filter(
        Idea.domain.in_(current_user.selected_domains)
    ).count()
    
    # Просмотренные
    viewed = db.query(IdeaView).filter(
        IdeaView.user_id == current_user.id
    ).count()
    
    # Свайпнутые
    swiped = db.query(Swipe).filter(
        Swipe.user_id == current_user.id
    ).count()
    
    # Лайкнутые
    liked = db.query(Swipe).filter(
        Swipe.user_id == current_user.id,
        Swipe.swipe == True
    ).count()
    
    remaining = max(0, total_available - viewed)
    
    return {
        "total_available": total_available,
        "viewed": viewed,
        "swiped": swiped,
        "liked": liked,
        "remaining": remaining,
        "domains": current_user.selected_domains
    } 


@router.post("/final", response_model=FinalIdeaResponse)
def generate_final_idea(
    payload: FinalIdeaRequest,
    current_user: User = Depends(get_current_user)
):
    """Генерирует финальную идею на основе топ-3 и ответов квиза.
    Под капотом пытается использовать OpenAI; если ключа нет, используется локальный фолбэк.
    """
    from ..tasks.idea_generator import client  # reuse configured OpenAI client
    import random
    import datetime
    import json

    if not payload.top_ideas:
        raise HTTPException(status_code=400, detail="top_ideas is required")

    # База: выбираем одну из топ-3 как каркас
    base = payload.top_ideas[0]
    if len(payload.top_ideas) > 1:
        base = random.choice(payload.top_ideas[:3])

    # Попытка GPT-персонализации
    if client:
        system_prompt = (
            "Ты продукт-менеджер. На основе выбранных пользователем трёх идей и ответов мини-квиза "
            "сгенерируй ОДНУ финальную идею: с коротким ярким title (<=60), ёмким description (<=220), "
            "6 тегами, и кратким обоснованием почему это подходит пользователю. Верни ЧИСТЫЙ JSON с полями: "
            "title, description, tags, aiReasoning, keyFeatures (список из 4-6), marketPotential (короткая строка)."
        )

        user_payload = {
            "topIdeas": [i.model_dump() for i in payload.top_ideas[:3]],
            "questionnaire": payload.questionnaire,
            "baseIdeaHint": base.model_dump(),
        }

        user_prompt = (
            "Сгенерируй персонализированную идею. Учитывай ответы пользователя. "
            "Верни только JSON."
        )

        try:
            resp = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.8,
                max_tokens=800,
            )
            content = resp.choices[0].message.content
            try:
                data = json.loads(content)
            except Exception:
                # В ответе могли быть тройные кавычки/кодблоки
                import re
                match = re.search(r"```json(.*?)```", content, re.S)
                data = json.loads(match.group(1).strip()) if match else json.loads(content)

            return FinalIdeaResponse(
                id="final-ai-generated",
                title=data.get("title", base.title),
                description=data.get("description", base.description),
                tags=data.get("tags", base.tags)[:6],
                domain=base.domain,
                personalizedFor=payload.questionnaire,
                confidence=95,
                aiReasoning=data.get("aiReasoning", "Personalized by GPT based on your answers"),
                keyFeatures=data.get("keyFeatures", ["AI personalization", "Scalable architecture"]),
                marketPotential=data.get("marketPotential", "High"),
                savedAt=datetime.datetime.utcnow().isoformat() + "Z",
            )
        except Exception as e:
            # Падать нельзя — используем фолбэк ниже
            print(f"❌ GPT final idea error: {e}")

    # Локальный фолбэк (без OpenAI)
    combined_tags = list({t for i in payload.top_ideas for t in (i.tags or [])})
    return FinalIdeaResponse(
        id="final-fallback",
        title=f"AI-Powered {base.title.split(' ')[-2:] and ' '.join(base.title.split(' ')[-2:])}",
        description=f"A personalized solution combining your top choices. Uses {', '.join(combined_tags[:3])}.",
        tags=combined_tags[:6] or base.tags,
        domain=base.domain,
        personalizedFor=payload.questionnaire,
        confidence=90,
        aiReasoning="Fallback: crafted locally from your top selections and answers.",
        keyFeatures=[
            "AI personalization",
            "Insights from your top-3",
            "Modern stack integration",
            "Scalable architecture",
        ],
        marketPotential="High",
        savedAt=datetime.datetime.utcnow().isoformat() + "Z",
    )