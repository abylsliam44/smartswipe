from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import User, Idea
from ..ml.advanced_recommender import advanced_recommender

router = APIRouter()


@router.post("/train")
def train_models(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Запускает обучение ML моделей"""
    
    try:
        # Получаем все данные для обучения
        ideas = db.query(Idea).all()
        users = db.query(User).filter(User.onboarding_completed == True).all()
        
        if len(ideas) < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Need at least 5 ideas to train models"
            )
        
        if len(users) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Need at least 2 users to train models"
            )
        
        # Обучаем все модели
        advanced_recommender.train_content_based_model(ideas)
        advanced_recommender.train_user_based_model(db, users)
        advanced_recommender.train_ensemble_model(db)
        
        return {
            "status": "success",
            "message": "ML models trained successfully",
            "ideas_count": len(ideas),
            "users_count": len(users),
            "metrics": advanced_recommender.get_training_metrics()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Training failed: {str(e)}"
        )


@router.get("/metrics")
def get_model_metrics(current_user: User = Depends(get_current_user)):
    """Получает метрики обученных моделей"""
    
    metrics = advanced_recommender.get_training_metrics()
    
    if not metrics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No trained models found. Train models first."
        )
    
    return {
        "training_metrics": metrics,
        "feature_importance": advanced_recommender.get_feature_importance()
    }


@router.get("/feature-importance")
def get_feature_importance(current_user: User = Depends(get_current_user)):
    """Получает важность признаков модели"""
    
    importance = advanced_recommender.get_feature_importance()
    
    if not importance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No trained ensemble model found"
        )
    
    return {"feature_importance": importance}


@router.get("/model-info")
def get_model_info(current_user: User = Depends(get_current_user)):
    """Получает информацию о состоянии моделей"""
    
    return {
        "content_model_trained": advanced_recommender.content_similarity_matrix is not None,
        "user_model_trained": advanced_recommender.user_similarity_matrix is not None,
        "ensemble_model_trained": advanced_recommender.ensemble_model is not None,
        "ideas_processed": len(advanced_recommender.ideas_df) if advanced_recommender.ideas_df is not None else 0,
        "users_processed": len(advanced_recommender.users_df) if advanced_recommender.users_df is not None else 0,
        "training_metrics_available": bool(advanced_recommender.get_training_metrics())
    } 