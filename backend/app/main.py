from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, ideas, swipes, ml, recommendations

app = FastAPI(
    title="SmartSwipe API",
    description="AI-powered startup idea recommendation system with machine learning personalization",
    version="2.0.0"
)

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(ideas.router, prefix="/ideas", tags=["ideas"])
app.include_router(swipes.router, prefix="/swipes", tags=["swipes"])
app.include_router(ml.router, prefix="/ml", tags=["ml"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])


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


@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "2.0.0"} 