from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


class IdeaBase(BaseModel):
    title: str
    description: str
    tags: List[str]
    domain: str


class IdeaCreate(IdeaBase):
    generated_for_domains: Optional[List[str]] = None


class IdeaRead(IdeaBase):
    id: UUID
    generated_for_domains: Optional[List[str]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class IdeaWithProbability(IdeaRead):
    probability: float
    confidence: str  # "high", "medium", "low"


class FinalIdeaRequest(BaseModel):
    top_ideas: List[IdeaRead]
    questionnaire: dict


class FinalIdeaResponse(IdeaBase):
    id: str
    personalizedFor: dict
    confidence: int
    aiReasoning: str
    keyFeatures: List[str]
    marketPotential: str
    savedAt: Optional[str] = None


class IdeaViewCreate(BaseModel):
    idea_id: UUID


class GameSession(BaseModel):
    """Сессия игры со свайпами - пачка идей для показа пользователю"""
    ideas: List[IdeaRead]
    session_id: str
    total_available: int 