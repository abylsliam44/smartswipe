from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..schemas.swipe import SwipeCreate, SwipeRead, SwipeWithIdea
from ..crud.swipe import create_swipe, get_user_swipes
from ..crud.idea import get_idea_by_id
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User

router = APIRouter()


@router.post("/", response_model=SwipeRead, status_code=status.HTTP_201_CREATED)
def create_user_swipe(
    swipe_data: SwipeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создает свайп пользователя (лайк/дизлайк идеи)"""
    
    # Проверяем, существует ли идея
    idea = get_idea_by_id(db, swipe_data.idea_id)
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea not found"
        )
    
    # Проверяем, что идея из доменов пользователя
    if current_user.selected_domains and idea.domain not in current_user.selected_domains:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only swipe ideas from your selected domains"
        )
    
    # Создаем свайп
    swipe = create_swipe(db, current_user.id, swipe_data)
    return SwipeRead.model_validate(swipe)


@router.get("/", response_model=List[SwipeWithIdea])
def get_my_swipes(
    skip: int = 0,
    limit: int = 50,
    liked_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получает историю свайпов пользователя"""
    
    swipes = get_user_swipes(
        db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        liked_only=liked_only
    )
    
    return [SwipeWithIdea.model_validate(swipe) for swipe in swipes]


@router.get("/stats")
def get_swipe_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Статистика свайпов пользователя"""
    
    from ..models import Swipe
    
    total_swipes = db.query(Swipe).filter(Swipe.user_id == current_user.id).count()
    
    likes = db.query(Swipe).filter(
        Swipe.user_id == current_user.id,
        Swipe.swipe == True
    ).count()
    
    dislikes = total_swipes - likes
    like_ratio = (likes / total_swipes * 100) if total_swipes > 0 else 0
    
    return {
        "total_swipes": total_swipes,
        "likes": likes,
        "dislikes": dislikes,
        "like_ratio": round(like_ratio, 1),
        "domains": current_user.selected_domains or []
    } 