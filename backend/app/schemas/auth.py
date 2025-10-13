from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, validator


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72, description="Password must be between 6 and 72 characters")
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) > 72:
            raise ValueError('Password cannot be longer than 72 characters')
        return v


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