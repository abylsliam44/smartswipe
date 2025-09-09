#!/usr/bin/env bash
set -e

# Проверяем, существуют ли таблицы
echo "🔍 Проверяем состояние базы данных..."
if python -c "
import os
from sqlalchemy import create_engine, text
try:
    engine = create_engine(os.getenv('DATABASE_URL'))
    with engine.connect() as conn:
        result = conn.execute(text(\"SELECT 1 FROM information_schema.tables WHERE table_name = 'users'\"))
        if result.fetchone():
            print('TABLES_EXIST')
        else:
            print('NO_TABLES')
except Exception as e:
    print('ERROR:', e)
" | grep -q "TABLES_EXIST"; then
    echo "✅ Таблицы уже существуют, помечаем миграции как примененные..."
    alembic stamp head
else
    echo "🔄 Применяем миграции..."
    alembic upgrade head
fi

# Запускаем приложение
echo "🚀 Запускаем приложение..."
exec uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 