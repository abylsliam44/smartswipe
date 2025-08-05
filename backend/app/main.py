from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, ideas, swipes, ml, recommendations

app = FastAPI(
    title="SmartSwipe API",
    description="AI-powered startup idea recommendation system with machine learning personalization",
    version="2.0.0"
)

# CORS настройки – универсальное решение
#   • Любой домен вида *.vercel.app (preview-URL от Vercel)
#   • Локальная разработка localhost:3000/5173
#   • credentials=True – токен передаётся в Authorization-header
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://[-a-zA-Z0-9]+\.vercel\.app$",
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- ensure tables exist (fallback when Alembic not executed) ----
from .database import Base, engine


@app.on_event("startup")
def _create_tables_if_missing():
    try:
        Base.metadata.create_all(bind=engine)
        print("[DB] create_all executed on startup")
    except Exception as exc:
        print(f"[DB] create_all failed: {exc}")

# Подключаем роутеры с /api префиксом
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(ideas.router, prefix="/api/ideas", tags=["ideas"])
app.include_router(swipes.router, prefix="/api/swipes", tags=["swipes"])
app.include_router(ml.router, prefix="/api/ml", tags=["ml"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["recommendations"])


@app.get("/")
def read_root():
    return {
        "message": "SmartSwipe API v2.0",
        "description": "AI-powered startup idea recommendation system",
        "features": [
            "User domain selection and onboarding",
            "AI-powered idea generation",
            "Swipe-based idea evaluation", 
            "Advanced ML personalization",
            "Content-based and collaborative filtering",
            "Real-time recommendations"
        ],
        "endpoints": {
            "auth": "/auth (register, login, domains selection)",
            "ideas": "/ideas (idea pool generation, game sessions)",
            "swipes": "/swipes (like/dislike tracking)",
            "ml": "/ml (model training and metrics)",
            "recommendations": "/recommendations (personalized suggestions)"
        }
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "2.0.0"}

@app.get("/api/test-cors")
def test_cors():
    return {
        "message": "CORS test successful",
        "cors_origins": "All domains allowed (*)",
        "timestamp": "2025-01-27T12:00:00Z"
    } 