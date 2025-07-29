from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
import uuid

from ..models import Swipe, Idea
from ..schemas.swipe import SwipeCreate


def create_swipe(db: Session, user_id: uuid.UUID, swipe_data: SwipeCreate) -> Swipe:
    """Создает новый свайп пользователя"""
    
    # Проверяем, не было ли уже свайпа этой идеи этим пользователем
    existing_swipe = db.query(Swipe).filter(
        and_(
            Swipe.user_id == user_id,
            Swipe.idea_id == swipe_data.idea_id
        )
    ).first()
    
    if existing_swipe:
        # Обновляем существующий свайп
        existing_swipe.swipe = swipe_data.swipe
        db.commit()
        db.refresh(existing_swipe)
        return existing_swipe
    
    # Создаем новый свайп
    swipe = Swipe(
        user_id=user_id,
        idea_id=swipe_data.idea_id,
        swipe=swipe_data.swipe
    )
    
    db.add(swipe)
    db.commit()
    db.refresh(swipe)
    return swipe


def get_user_swipes(
    db: Session,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
    liked_only: bool = False
) -> List[Swipe]:
    """Получает свайпы пользователя с присоединенными идеями"""
    
    query = db.query(Swipe).filter(Swipe.user_id == user_id)
    
    if liked_only:
        query = query.filter(Swipe.swipe == True)
    
    # Присоединяем идеи для получения полной информации
    query = query.join(Idea, Swipe.idea_id == Idea.id)
    
    return query.offset(skip).limit(limit).all()


def get_user_likes(db: Session, user_id: uuid.UUID) -> List[Swipe]:
    """Получает все лайки пользователя (для ML)"""
    
    return db.query(Swipe).filter(
        and_(
            Swipe.user_id == user_id,
            Swipe.swipe == True
        )
    ).join(Idea, Swipe.idea_id == Idea.id).all()


def get_user_swipe_history(db: Session, user_id: uuid.UUID) -> List[Swipe]:
    """Получает всю историю свайпов пользователя (для ML)"""
    
    return db.query(Swipe).filter(Swipe.user_id == user_id).join(
        Idea, Swipe.idea_id == Idea.id
    ).all() 