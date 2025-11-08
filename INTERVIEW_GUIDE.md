# 🎯 SmartSwipe - Гайд для Собеседования

## 📌 Краткое Описание (Elevator Pitch - 30 секунд)

**SmartSwipe** — это платформа для discovery стартап-идей, использующая **AI (GPT-4) для генерации** и **Machine Learning для персонализации**. 

Пользователи:
1. Выбирают интересующие домены (FinTech, AI/ML, HealthTech и т.д.)
2. Свайпают AI-сгенерированные идеи (как в Tinder)
3. Получают персонализированные рекомендации на основе ML-алгоритмов (точность 75%, F1-score 84.62%)
4. Находят идеальную идею для стартапа через квиз и финальный AI-анализ

**Технологии**: FastAPI, PostgreSQL, React, OpenAI GPT-4, Scikit-learn (Ensemble ML), Docker

---

## 🏗️ Архитектура Проекта

### High-Level Architecture

```
┌──────────────────┐         ┌────────────────────┐         ┌──────────────────┐
│  React Frontend  │  HTTP   │  FastAPI Backend   │  SQL    │   PostgreSQL     │
│  (Vite + Zustand)│◄───────►│  + ML Pipeline     │◄───────►│   Database       │
└──────────────────┘         └────────────────────┘         └──────────────────┘
                                      │
                                      │ REST API
                                      ▼
                             ┌────────────────────┐
                             │   OpenAI GPT-4     │
                             │  Idea Generation   │
                             └────────────────────┘
                                      │
                                      ▼
                             ┌────────────────────┐
                             │  Advanced ML       │
                             │  Recommender       │
                             │  • Content-Based   │
                             │  • User-Based      │
                             │  • Ensemble        │
                             └────────────────────┘
```

### Технологический Стек

#### Backend
- **FastAPI** — Современный Python-фреймворк с автодокументацией (Swagger/OpenAPI)
- **PostgreSQL** — Реляционная БД с поддержкой JSON
- **SQLAlchemy + Alembic** — ORM и миграции
- **OpenAI GPT-4** — Генерация startup-идей
- **Scikit-learn** — ML-библиотека (Ensemble, TF-IDF, Cosine Similarity)
- **JWT** — Токен-аутентификация

#### Frontend
- **React 18** — UI с hooks (useState, useEffect, useContext)
- **Vite** — Быстрый build-tool (вместо Webpack)
- **Zustand** — State management (легковесная альтернатива Redux)
- **TailwindCSS** — Utility-first CSS
- **Framer Motion** — Анимации и swipe-жесты
- **React Router** — Клиентский роутинг

#### DevOps
- **Docker + Docker Compose** — Контейнеризация (frontend, backend, db, pgadmin)
- **Nginx** — Reverse proxy для фронтенда
- **Model Persistence** — Сохранение ML-моделей в `.pkl` файлах

---

## 🎮 User Flow (Полный Путь Пользователя)

### 1. Регистрация и Аутентификация
```http
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securepass"
}
→ Возвращает JWT токен + user_id
→ onboarding_completed: false
```

**Технические детали:**
- Пароль хешируется через `bcrypt`
- JWT содержит `user_id` и `exp` (время истечения)
- Token хранится в Zustand store (localStorage)

### 2. Онбординг - Выбор Доменов
```http
POST /api/auth/domains
{
  "domains": ["FinTech", "AI/ML", "HealthTech"]
}
→ Сохраняет в user.selected_domains (JSON поле)
→ onboarding_completed: true
```

**Поддерживаемые домены:**
- FinTech, AI/ML, HealthTech, EdTech, E-commerce, SaaS, Social Media, GreenTech
- Пользователь может добавить кастомные домены через профиль

### 3. AI Генерация Идей (Background Task)
```http
POST /api/ideas/generate-pool
→ Асинхронно генерирует по 10 идей на каждый выбранный домен
→ Использует OpenAI GPT-4 с промптом:
   "Generate 10 innovative startup ideas for {domain}"
```

**Как работает:**
```python
# backend/app/tasks/idea_generator.py

def generate_ideas_with_openai(domain: str, count: int = 10):
    prompt = f"""
    Generate {count} innovative startup ideas in {domain} domain.
    For each idea provide:
    - Title (3-7 words)
    - Description (2-3 sentences)
    - Tags (3-5 relevant keywords)
    
    Format: JSON array with title, description, tags
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    
    # Парсим JSON и сохраняем в БД
    ideas = json.loads(response.choices[0].message.content)
    for idea in ideas:
        db.add(Idea(
            title=idea['title'],
            description=idea['description'],
            tags=idea['tags'],
            domain=domain,
            generated_for_domains=[domain]
        ))
```

### 4. Swiping - Игровая Сессия
```http
GET /api/ideas/game-session?limit=5
→ Возвращает непросмотренные идеи из выбранных доменов
→ Автоматически помечает идеи как viewed в idea_views
```

**SQL запрос для получения непросмотренных идей:**
```sql
SELECT ideas.* FROM ideas
WHERE ideas.domain IN ('FinTech', 'AI/ML', 'HealthTech')  -- Выбранные домены
AND ideas.id NOT IN (
    SELECT idea_id FROM idea_views 
    WHERE user_id = 'current_user_id'
)
ORDER BY RANDOM()
LIMIT 5;
```

**Swipe действие:**
```http
POST /api/swipes/
{
  "idea_id": "uuid-123",
  "swipe": true  # true = like, false = dislike
}
→ Сохраняет в таблицу swipes
→ Триггерит обновление ML-модели (если достаточно данных)
```

### 5. ML Персонализация - Рекомендации

**Три типа рекомендательных алгоритмов:**

#### A) Content-Based Filtering
```python
# Анализирует сходство идей по тексту (title + description + tags)

# 1. TF-IDF векторизация
combined_text = f"{idea.title} {idea.description} {' '.join(idea.tags)}"
tfidf_matrix = TfidfVectorizer(max_features=1000).fit_transform(texts)

# 2. Cosine Similarity
similarity_matrix = cosine_similarity(tfidf_matrix)

# 3. Находим похожие идеи на те, что пользователь лайкнул
user_liked_ideas = [idea1, idea2, idea3]
for liked_idea in user_liked_ideas:
    similar_ideas = get_top_similar(liked_idea, similarity_matrix, top_n=5)
```

**Когда используется:** Новый пользователь с малым количеством свайпов

#### B) User-Based Collaborative Filtering
```python
# Находит пользователей с похожими предпочтениями

# 1. Создаём матрицу user-item (пользователь x идея)
# Значения: 1 = like, -1 = dislike, 0 = не видел
user_item_matrix = [[1, -1, 0, 1],   # User 1
                    [1, -1, 1, 0],   # User 2
                    [0, 1, -1, 1]]   # User 3

# 2. Cosine Similarity между пользователями
user_similarity = cosine_similarity(user_item_matrix)

# 3. Рекомендуем идеи, которые лайкнули похожие пользователи
similar_users = [user2, user5]
recommended_ideas = ideas_liked_by(similar_users) - ideas_seen_by(current_user)
```

**Когда используется:** Много пользователей с историей взаимодействий

#### C) Ensemble ML (Production Model) ⭐
```python
# Комбинирует 3 алгоритма: Logistic Regression, Random Forest, Gradient Boosting

# 1. Feature Engineering (8 признаков)
features = [
    len(idea.title + idea.description),      # Длина текста
    len(idea.tags),                          # Количество тегов
    domain_encoded,                          # Закодированный домен (0-7)
    domain_match,                            # Совпадает ли с выбранными (0/1)
    len(user_swipe_history),                 # Сколько всего свайпов
    len(user_likes),                         # Сколько лайков
    user_like_ratio,                         # Процент лайков (0.0-1.0)
    len(user.selected_domains)               # Количество выбранных доменов
]

# 2. Обучение с Cross-Validation
models = {
    'logistic': LogisticRegression(),
    'random_forest': RandomForestClassifier(n_estimators=100),
    'gradient_boosting': GradientBoostingClassifier()
}

for name, model in models.items():
    scores = cross_val_score(model, X, y, cv=5)
    # Выбираем модель с лучшим score

# 3. Prediction
probability = best_model.predict_proba(features)[0][1]  # Вероятность лайка (0-1)
confidence = "high" if abs(probability - 0.5) > 0.3 else "medium"
```

**Метрики Production Model:**
- **Accuracy**: 75%
- **Precision**: 75.86% (насколько точны наши рекомендации)
- **Recall**: 95.65% (не пропускаем идеи, которые понравятся)
- **F1-Score**: 84.62% (гармоническое среднее)
- **Cross-Validation**: 80.32% ± 2.14%

**API рекомендаций:**
```http
GET /api/recommendations/?limit=10

Response:
{
  "recommendations": [
    {
      "idea": {
        "id": "uuid",
        "title": "AI-Powered Personal Finance Coach",
        "description": "Smart budgeting app...",
        "tags": ["AI", "FinTech"]
      },
      "probability": 0.87,        # Вероятность лайка (ML prediction)
      "confidence": "high",       # high/medium/low
      "method": "ensemble_ml"     # Какой алгоритм использовался
    }
  ]
}
```

### 6. Top-3 Selection & Quiz & Final Idea

После 10+ свайпов:
1. Пользователь выбирает **3 лучшие идеи** (gold, silver, bronze medals)
2. Проходит **интерактивный квиз** (5-7 вопросов для уточнения предпочтений)
3. Получает **финальную идею** от GPT-4 на основе всех данных (с confetti анимацией)

---

## 🗄️ Database Schema

```sql
-- Пользователи
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    selected_domains JSON,              -- ["FinTech", "AI/ML"]
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Идеи
CREATE TABLE ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR UNIQUE NOT NULL,
    description TEXT NOT NULL,
    tags JSON NOT NULL,                 -- ["AI", "Finance", "Investing"]
    domain VARCHAR NOT NULL,            -- "FinTech"
    generated_for_domains JSON,         -- ["FinTech", "AI/ML"]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Свайпы (для ML обучения)
CREATE TABLE swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
    swipe BOOLEAN NOT NULL,             -- true = like, false = dislike
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, idea_id)
);

-- Просмотры (для фильтрации уже показанных)
CREATE TABLE idea_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, idea_id)
);

-- Метаданные ML-моделей
CREATE TABLE ml_model_meta (
    id VARCHAR PRIMARY KEY DEFAULT 'current',
    trained_at TIMESTAMP WITH TIME ZONE,
    accuracy VARCHAR,
    precision VARCHAR,
    recall VARCHAR,
    f1 VARCHAR,
    roc_auc VARCHAR,
    model_path VARCHAR
);
```

**Индексы для производительности:**
```sql
CREATE INDEX idx_swipes_user_id ON swipes(user_id);
CREATE INDEX idx_swipes_idea_id ON swipes(idea_id);
CREATE INDEX idx_ideas_domain ON ideas(domain);
CREATE INDEX idx_idea_views_user_id ON idea_views(user_id);
CREATE INDEX idx_users_domains ON users USING GIN(selected_domains);  -- GIN для JSON
CREATE INDEX idx_ideas_tags ON ideas USING GIN(tags);                 -- GIN для JSON
```

---

## 🚀 API Endpoints (REST)

### Authentication
```
POST   /api/auth/register              # Регистрация
POST   /api/auth/login                 # Логин (получение JWT)
GET    /api/auth/me                    # Текущий пользователь
POST   /api/auth/domains               # Выбор доменов (онбординг)
GET    /api/auth/available-domains     # Список доступных доменов
```

### Profile Management
```
GET    /api/auth/profile/domains                # Получить домены пользователя
POST   /api/auth/profile/domains/add            # Добавить домен
POST   /api/auth/profile/domains/custom         # Создать кастомный домен
DELETE /api/auth/profile/domains/remove         # Удалить домен
```

### Ideas
```
POST   /api/ideas/generate-pool        # Генерация идей (GPT-4)
GET    /api/ideas/game-session         # Получить идеи для свайпинга
GET    /api/ideas/stats                # Статистика пользователя
```

### Swipes
```
POST   /api/swipes/                    # Создать свайп (like/dislike)
GET    /api/swipes/liked               # Получить лайкнутые идеи
GET    /api/swipes/history             # История свайпов
```

### ML & Recommendations
```
GET    /api/recommendations/           # ML-персонализированные рекомендации
POST   /api/ml/train                   # Обучить ML-модели
GET    /api/ml/status                  # Статус и метрики моделей
```

---

## 🔐 Security

### 1. Authentication (JWT)
```python
# Генерация токена
from jose import jwt
from datetime import datetime, timedelta

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode, 
        SECRET_KEY,  # Из .env
        algorithm="HS256"
    )
    return encoded_jwt

# Проверка токена
def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    return user
```

### 2. Password Hashing
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# При регистрации
hashed_password = pwd_context.hash("plain_password")

# При логине
pwd_context.verify("plain_password", hashed_password)  # True/False
```

### 3. CORS Configuration
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Dev
        "https://*.vercel.app"     # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
```

### 4. SQL Injection Protection
- Используем **SQLAlchemy ORM** → автоматические параметризованные запросы
- Все user inputs валидируются через **Pydantic schemas**

### 5. Environment Variables
```bash
# .env
DATABASE_URL=postgresql://user:pass@localhost/db
SECRET_KEY=super-secret-key-32-chars-min
OPENAI_API_KEY=sk-...
```

---

## 🐳 DevOps & Deployment

### Docker Architecture
```yaml
# docker-compose.yml

services:
  frontend:
    build: ./frontend
    ports: ["3000:80"]
    # Nginx serves React build
  
  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [db]
    environment:
      - DATABASE_URL=postgresql://...
  
  db:
    image: postgres:15
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data
  
  pgadmin:
    image: dpage/pgadmin4
    ports: ["5050:80"]
```

### Deployment Flow
```bash
# 1. Клонируем проект
git clone https://github.com/abylsliam44/smartswipe.git
cd smartswipe

# 2. Настраиваем .env
cp .env.example .env
# Добавляем OPENAI_API_KEY, SECRET_KEY

# 3. Поднимаем контейнеры
docker-compose up -d

# 4. Миграции БД (внутри backend контейнера)
docker-compose exec backend alembic upgrade head

# 5. Доступ к приложению
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000/docs  (Swagger UI)
# pgAdmin:   http://localhost:5050
```

### Production Considerations
- **Database**: Managed PostgreSQL (AWS RDS, DigitalOcean)
- **Backend**: Heroku, Render, Railway
- **Frontend**: Vercel, Netlify
- **ML Models**: Persistent storage (S3, volume mounts)
- **Caching**: Redis для кеширования рекомендаций
- **Monitoring**: Sentry для error tracking

---

## 🎯 Сложные Вопросы на Собеседовании

### Q1: Почему выбрали FastAPI, а не Flask/Django?
**Ответ:**
- **Performance**: FastAPI на 40% быстрее Django благодаря async/await и Starlette
- **Auto-documentation**: Автоматическая генерация Swagger UI и OpenAPI schema
- **Type Safety**: Pydantic для валидации → меньше runtime ошибок
- **Modern Python**: Native async support для ML-вычислений и OpenAI API calls

### Q2: Как масштабируется ML-система при росте пользователей?
**Ответ:**
1. **Batch Prediction**: Предварительно вычисляем рекомендации для всех пользователей (nightly job)
2. **Caching**: Redis cache для top-N рекомендаций (TTL 1 час)
3. **Model Versioning**: Храним несколько версий моделей, rollback при ухудшении метрик
4. **Incremental Learning**: Обновляем модель только на новых данных (не переобучаем с нуля)
5. **Horizontal Scaling**: Микросервисная архитектура (отдельный сервис для ML)

### Q3: Как обрабатываете cold start problem (новый пользователь)?
**Ответ:**
- **Онбординг**: Выбор доменов → сразу фильтруем идеи по интересам
- **Content-Based**: Используем TF-IDF для первых рекомендаций (не нужна история)
- **Popular Items**: Fallback на самые популярные идеи в выбранных доменах
- **Active Learning**: Квиз после 10 свайпов → улучшаем понимание предпочтений

### Q4: Как валидируете качество генерации GPT-4?
**Ответ:**
1. **Structured Prompts**: Чёткий формат (JSON) → парсинг без ошибок
2. **Validation Layer**: Pydantic проверяет наличие title, description, tags
3. **Uniqueness Check**: Проверяем title в БД (UNIQUE constraint)
4. **Manual Review**: Админ-панель для модерации идей
5. **A/B Testing**: Сравниваем GPT-4 vs GPT-3.5 по engagement метрикам

### Q5: Что делать, если OpenAI API недоступен?
**Ответ:**
- **Retry Logic**: Exponential backoff (1s → 2s → 4s)
- **Fallback**: Используем pre-generated идеи из seed базы
- **Circuit Breaker**: После 3 неудач переключаемся на fallback на 10 минут
- **Monitoring**: Alerting в Slack/Telegram при downtime

### Q6: Почему F1-score важнее Accuracy для рекомендаций?
**Ответ:**
- **Imbalanced Data**: Обычно dislike > like (70% vs 30%)
- **Accuracy**: Можно достичь 70% просто предсказывая "dislike" всегда
- **Precision**: Важно не показывать нерелевантные идеи (bad UX)
- **Recall**: Важно не пропустить идеи, которые понравятся (missed opportunity)
- **F1**: Баланс между precision и recall → оптимальный UX

### Q7: Как тестируете ML-модели?
**Ответ:**
1. **Train/Test Split**: 80/20 для оценки на unseen data
2. **Cross-Validation**: 5-fold CV для надёжных метрик
3. **A/B Testing**: Рандомно 50% пользователей получают новую модель
4. **Offline Metrics**: Precision@K, NDCG, Hit Rate
5. **Online Metrics**: CTR, Session Length, Conversion Rate
6. **Manual Testing**: Тестовые пользователи проверяют качество рекомендаций

### Q8: Как оптимизируете производительность БД?
**Ответ:**
- **Indexes**: GIN индексы для JSON полей (tags, selected_domains)
- **Connection Pooling**: SQLAlchemy pool_size=20
- **Query Optimization**: `.options(joinedload())` для избежания N+1 queries
- **Pagination**: LIMIT/OFFSET для больших выборок
- **Materialized Views**: Pre-computed статистика для дашбордов
- **Read Replicas**: Разделение read/write нагрузки

---

## 💡 Что Выделяет Проект

### 1. Production-Ready ML Pipeline
- ✅ Ensemble алгоритмы с cross-validation
- ✅ Feature engineering (8 признаков)
- ✅ Model persistence (.pkl файлы)
- ✅ Performance metrics tracking
- ✅ Real-time predictions

### 2. Modern Tech Stack
- ✅ FastAPI (async) + React (hooks)
- ✅ Docker containerization
- ✅ Type safety (Pydantic, TypeScript)
- ✅ Auto-documentation (Swagger)

### 3. Scalable Architecture
- ✅ Microservices-ready (можно вынести ML в отдельный сервис)
- ✅ Stateless backend (можно горизонтально масштабировать)
- ✅ Database optimization (индексы, JSON поля)

### 4. Real AI/ML Integration
- ✅ GPT-4 для генерации контента (не просто CRUD)
- ✅ 3 типа рекомендательных систем
- ✅ Метрики выше базовых бенчмарков (F1: 84.62%)

### 5. Complete User Experience
- ✅ Онбординг → Генерация → Свайпинг → Рекомендации → Квиз → Финал
- ✅ Gamification (swipe интерфейс, медали, confetti)
- ✅ Персонализация на каждом этапе

---

## 📊 Метрики для Резюме

- **Backend**: FastAPI REST API с **8 роутерами**, **15+ эндпоинтов**
- **ML Pipeline**: **3 алгоритма** (Content-Based, User-Based, Ensemble)
- **Model Performance**: **75% accuracy**, **84.62% F1-score**, **95.65% recall**
- **Database**: PostgreSQL с **5 таблицами**, **7 оптимизированными индексами**
- **Frontend**: React SPA с **10+ страницами**, **Zustand state management**
- **AI Integration**: OpenAI GPT-4 для **генерации 10+ идей** на домен
- **Deployment**: **Docker Compose** с **4 сервисами** (frontend, backend, db, pgadmin)

---

## 🎤 Closing Statement (Заключение)

SmartSwipe демонстрирует **полный цикл разработки ML-продукта**:
- От идеи (discovery стартапов) до production deployment
- Интеграция AI (GPT-4) и классического ML (Scikit-learn)
- Современный tech stack с best practices (Docker, JWT, ORM)
- Метрики, которые можно измерить и улучшать

Проект готов к **масштабированию** (микросервисы, caching, read replicas) и **развитию** (Deep Learning, Reinforcement Learning, A/B testing).

---

**Удачи на собеседовании! 🚀**

