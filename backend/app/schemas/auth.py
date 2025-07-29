from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: UUID
    email: str
    selected_domains: Optional[List[str]] = None
    onboarding_completed: bool = False

    model_config = {"from_attributes": True}


class UserDomainSelection(BaseModel):
    domains: List[str]  # ["FinTech", "HealthTech", "EdTech", etc.]


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead 