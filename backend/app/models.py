import uuid

from sqlalchemy import Boolean, Column, ForeignKey, JSON, String, Text, TIMESTAMP, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    selected_domains = Column(JSON, nullable=True)  # Список интересующих сфер ["FinTech", "HealthTech"]
    onboarding_completed = Column(Boolean, default=False)  # Завершил ли пользователь онбординг
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    swipes = relationship("Swipe", back_populates="user", cascade="all, delete-orphan")
    idea_views = relationship("IdeaView", back_populates="user", cascade="all, delete-orphan")


class Idea(Base):
    __tablename__ = "ideas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=False)
    tags = Column(JSON, nullable=False)
    domain = Column(String, nullable=False)  # Основной домен: FinTech, HealthTech, etc.
    generated_for_domains = Column(JSON, nullable=True)  # Для каких доменов создавалась
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    swipes = relationship("Swipe", back_populates="idea", cascade="all, delete-orphan")
    idea_views = relationship("IdeaView", back_populates="idea", cascade="all, delete-orphan")


class Swipe(Base):
    __tablename__ = "swipes"
    __table_args__ = (
        UniqueConstraint("user_id", "idea_id", name="unique_swipe_user_idea"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    idea_id = Column(UUID(as_uuid=True), ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False)
    swipe = Column(Boolean, nullable=False)  # True = like, False = dislike
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="swipes")
    idea = relationship("Idea", back_populates="swipes")


class IdeaView(Base):
    __tablename__ = "idea_views"
    __table_args__ = (
        UniqueConstraint("user_id", "idea_id", name="unique_view_user_idea"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    idea_id = Column(UUID(as_uuid=True), ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False)
    viewed_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="idea_views")
    idea = relationship("Idea", back_populates="idea_views")


class MLModelMeta(Base):
    __tablename__ = "ml_model_meta"

    id = Column(String, primary_key=True, default="current")
    trained_at = Column(TIMESTAMP(timezone=True))
    accuracy = Column(String)
    model_path = Column(String)
    precision = Column(String)
    recall = Column(String)
    f1 = Column(String)
    roc_auc = Column(String) 