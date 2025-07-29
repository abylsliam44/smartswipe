FROM python:3.11-slim

WORKDIR /code

# Установка зависимостей
COPY requirements.txt ./
# Увеличиваем таймаут и количество попыток для нестабильных соединений
ENV PIP_DEFAULT_TIMEOUT=300
RUN pip install --upgrade pip \
    && pip install --no-cache-dir --timeout 300 --retries 20 --progress-bar off -r requirements.txt

# Копируем весь проект (для доступа к пакету backend)
COPY . .

EXPOSE 8000

RUN chmod +x /code/backend/entrypoint.sh
ENTRYPOINT ["bash", "/code/backend/entrypoint.sh"] 