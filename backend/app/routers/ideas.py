from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..schemas.idea import IdeaRead, GameSession, IdeaViewCreate
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