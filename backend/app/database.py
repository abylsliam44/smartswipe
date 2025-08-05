from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import get_settings

settings = get_settings()

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator:
    """Yield database session scoped to request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Автоматически создаём таблицы при первом запуске, если Alembic ещё не применён
# Это безопасно: create_all создаёт только отсутствующие объекты и не трогает существующие
from . import models  # noqa: E402 — регистрирует все ORM-модели

try:
    Base.metadata.create_all(bind=engine)
except Exception as exc:
    # Логируем, но не останавливаем приложение — Render покажет в логах
    print(f"[DB] create_all failed: {exc}") 