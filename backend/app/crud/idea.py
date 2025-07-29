from sqlalchemy.orm import Session
from sqlalchemy import and_, not_
from typing import List, Optional
import uuid

from ..models import Idea, IdeaView, Swipe
from ..schemas.idea import IdeaCreate


def create_idea(db: Session, idea_data: IdeaCreate) -> Idea:
    """Создает новую идею в БД"""
    
    # Проверяем, не существует ли уже такая идея
    existing = db.query(Idea).filter(Idea.title == idea_data.title).first()
    if existing:
        return existing
    
    idea = Idea(
        id=uuid.uuid4(),
        title=idea_data.title,
        description=idea_data.description,
        tags=idea_data.tags,
        domain=idea_data.domain,
        generated_for_domains=idea_data.generated_for_domains
    )
    
    db.add(idea)
    db.commit()
    db.refresh(idea)
    return idea


def get_ideas_for_user(
    db: Session, 
    user_domains: List[str], 
    skip: int = 0, 
    limit: int = 20,
    domain_filter: Optional[str] = None
) -> List[Idea]:
    """Получает идеи для пользователя из его доменов"""
    
    query = db.query(Idea)
    
    if user_domains:
        query = query.filter(Idea.domain.in_(user_domains))
    
    if domain_filter:
        query = query.filter(Idea.domain == domain_filter)
    
    return query.offset(skip).limit(limit).all()


def get_user_unseen_ideas(
    db: Session,
    user_id: uuid.UUID, 
    user_domains: List[str],
    limit: int = 10
) -> List[Idea]:
    """Получает непросмотренные пользователем идеи из его доменов"""
    
    if not user_domains:
        return []
    
    # Подзапрос для просмотренных идей
    viewed_ideas = db.query(IdeaView.idea_id).filter(IdeaView.user_id == user_id)
    
    # Основной запрос: идеи из доменов пользователя, которые он не видел
    query = db.query(Idea).filter(
        and_(
            Idea.domain.in_(user_domains),
            not_(Idea.id.in_(viewed_ideas))
        )
    ).limit(limit)
    
    return query.all()


def mark_idea_as_viewed(db: Session, user_id: uuid.UUID, idea_id: uuid.UUID):
    """Отмечает идею как просмотренную пользователем"""
    
    # Проверяем, не была ли уже просмотрена
    existing = db.query(IdeaView).filter(
        and_(IdeaView.user_id == user_id, IdeaView.idea_id == idea_id)
    ).first()
    
    if existing:
        return existing
    
    view = IdeaView(
        user_id=user_id,
        idea_id=idea_id
    )
    
    db.add(view)
    db.commit()
    db.refresh(view)
    return view


def get_idea_by_id(db: Session, idea_id: uuid.UUID) -> Optional[Idea]:
    """Получает идею по ID"""
    return db.query(Idea).filter(Idea.id == idea_id).first()


def bulk_create_ideas(db: Session, ideas_data: List[IdeaCreate]) -> List[Idea]:
    """Массово создает идеи (для генератора)"""
    
    created_ideas = []
    
    for idea_data in ideas_data:
        # Проверяем дубликаты
        existing = db.query(Idea).filter(Idea.title == idea_data.title).first()
        if existing:
            continue
            
        idea = Idea(
            id=uuid.uuid4(),
            title=idea_data.title,
            description=idea_data.description,
            tags=idea_data.tags,
            domain=idea_data.domain,
            generated_for_domains=idea_data.generated_for_domains
        )
        
        db.add(idea)
        created_ideas.append(idea)
    
    if created_ideas:
        db.commit()
        for idea in created_ideas:
            db.refresh(idea)
    
    return created_ideas 