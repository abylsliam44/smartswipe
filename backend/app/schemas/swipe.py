from uuid import UUID
from pydantic import BaseModel


class SwipeCreate(BaseModel):
    idea_id: UUID
    swipe: bool  # True = like, False = dislike


class SwipeRead(BaseModel):
    id: UUID
    user_id: UUID
    idea_id: UUID
    swipe: bool

    model_config = {"from_attributes": True}


class SwipeWithIdea(SwipeRead):
    """Свайп с информацией об идее"""
    idea_title: str
    idea_tags: list[str] 