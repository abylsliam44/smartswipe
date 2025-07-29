#!/usr/bin/env bash
set -e

# Применяем миграции
alembic upgrade head

# Запускаем приложение
exec uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 