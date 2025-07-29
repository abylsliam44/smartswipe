from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..schemas.idea import IdeaWithProbability
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User, Idea
from ..crud.idea import get_user_unseen_ideas, get_idea_by_id
from ..ml.advanced_recommender import advanced_recommender

router = APIRouter()


@router.get("/", response_model=List[IdeaWithProbability])
def get_personalized_recommendations(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получает персонализированные рекомендации на основе ML"""
    
    if not current_user.onboarding_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complete onboarding first"
        )
    
    if not current_user.selected_domains:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No domains selected"
        )
    
    # Получаем непросмотренные идеи
    unseen_ideas = get_user_unseen_ideas(
        db, 
        current_user.id, 
        current_user.selected_domains,
        limit=limit * 3  # Берем больше для лучшей фильтрации
    )
    
    if not unseen_ideas:
        return []
    
    # Получаем рекомендации от ML модели
    recommendations = advanced_recommender.get_recommendations(
        db, current_user, unseen_ideas, top_k=limit
    )
    
    # Формируем ответ
    result = []
    for rec in recommendations:
        idea = rec["idea"]
        result.append(IdeaWithProbability(
            id=idea.id,
            title=idea.title,
            description=idea.description,
            tags=idea.tags,
            domain=idea.domain,
            generated_for_domains=idea.generated_for_domains,
            created_at=idea.created_at,
            probability=rec["probability"],
            confidence=rec["confidence"]
        ))
    
    return result


@router.get("/explain/{idea_id}")
def explain_recommendation(
    idea_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Объясняет, почему идея была рекомендована пользователю"""
    
    idea = get_idea_by_id(db, idea_id)
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea not found"
        )
    
    # Получаем предсказание
    prediction = advanced_recommender.predict_user_preference(db, current_user, idea)
    
    # Получаем важность признаков
    feature_importance = advanced_recommender.get_feature_importance()
    
    # Анализируем факторы
    factors = []
    
    # Домен соответствие
    if idea.domain in (current_user.selected_domains or []):
        factors.append({
            "factor": "Domain Match",
            "impact": "positive",
            "description": f"This idea is in '{idea.domain}', which you selected as an interest"
        })
    else:
        factors.append({
            "factor": "Domain Mismatch", 
            "impact": "negative",
            "description": f"This idea is in '{idea.domain}', which is not in your selected domains"
        })
    
    # Количество тегов
    if len(idea.tags) >= 3:
        factors.append({
            "factor": "Rich Tags",
            "impact": "positive", 
            "description": f"This idea has {len(idea.tags)} tags, providing good categorization"
        })
    
    # Длина описания
    if len(idea.description) > 100:
        factors.append({
            "factor": "Detailed Description",
            "impact": "positive",
            "description": "This idea has a comprehensive description"
        })
    
    return {
        "idea_id": str(idea_id),
        "idea_title": idea.title,
        "prediction": prediction,
        "feature_importance": feature_importance,
        "explanation_factors": factors,
        "recommendation_strength": "high" if prediction["probability"] > 0.7 else "medium" if prediction["probability"] > 0.4 else "low"
    }


@router.get("/similar/{idea_id}")
def get_similar_ideas(
    idea_id: uuid.UUID,
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получает похожие идеи на основе content-based фильтрации"""
    
    idea = get_idea_by_id(db, idea_id)
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea not found"
        )
    
    # Получаем все идеи из доменов пользователя
    all_ideas = db.query(Idea).filter(
        Idea.domain.in_(current_user.selected_domains or [])
    ).all()
    
    if not advanced_recommender.content_similarity_matrix is not None:
        # Fallback: похожие по домену и тегам
        similar_ideas = []
        for other_idea in all_ideas:
            if other_idea.id == idea_id:
                continue
                
            # Простое сходство по тегам
            common_tags = set(idea.tags) & set(other_idea.tags)
            similarity = len(common_tags) / max(len(idea.tags), len(other_idea.tags), 1)
            
            if similarity > 0.2:  # порог сходства
                similar_ideas.append({
                    "idea": other_idea,
                    "similarity": similarity
                })
        
        # Сортируем по сходству
        similar_ideas.sort(key=lambda x: x["similarity"], reverse=True)
        
        return [
            {
                "id": str(sim["idea"].id),
                "title": sim["idea"].title,
                "description": sim["idea"].description,
                "tags": sim["idea"].tags,
                "domain": sim["idea"].domain,
                "similarity": sim["similarity"]
            }
            for sim in similar_ideas[:limit]
        ]
    
    return {"message": "Content-based model not trained yet"}


@router.get("/stats")
def get_recommendation_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Статистика рекомендательной системы для пользователя"""
    
    # Общее количество идей в доменах пользователя
    total_ideas = db.query(Idea).filter(
        Idea.domain.in_(current_user.selected_domains or [])
    ).count()
    
    # Непросмотренные идеи
    unseen_ideas_count = len(get_user_unseen_ideas(
        db, current_user.id, current_user.selected_domains or [], limit=1000
    ))
    
    # Статус ML модели
    model_status = {
        "content_model": advanced_recommender.content_similarity_matrix is not None,
        "user_model": advanced_recommender.user_similarity_matrix is not None,
        "ensemble_model": advanced_recommender.ensemble_model is not None
    }
    
    return {
        "total_ideas_in_domains": total_ideas,
        "unseen_ideas": unseen_ideas_count,
        "recommendation_coverage": round((total_ideas - unseen_ideas_count) / total_ideas * 100, 1) if total_ideas > 0 else 0,
        "ml_models_status": model_status,
        "domains": current_user.selected_domains or []
    } 