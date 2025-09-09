from typing import Generator

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# Читаем URL базы данных из переменных окружения, чтобы совпадало с Alembic/Render
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Явная ошибка поможет быстрее диагностировать проблему конфигурации
    raise RuntimeError("DATABASE_URL is not set")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    future=True,
)
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