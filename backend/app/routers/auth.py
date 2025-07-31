from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from ..schemas.auth import UserRegister, UserRead, UserDomainSelection, Token
from ..crud.auth import create_user, authenticate_user, get_user_by_email
from ..database import get_db
from ..dependencies import create_access_token, get_current_user
from ..models import User

router = APIRouter()

# Маппинг доменов
DOMAIN_MAPPING = {
    "fintech": "FinTech",
    "healthtech": "HealthTech", 
    "edtech": "EdTech",
    "ecommerce": "E-commerce",
    "gaming": "Gaming",
    "saas": "SaaS",
    "ai-ml": "AI/ML",
    "sustainability": "Sustainability"
}

AVAILABLE_DOMAINS = [
    {"id": "fintech", "name": "FinTech", "description": "Финансовые технологии, банкинг, платежи"},
    {"id": "healthtech", "name": "HealthTech", "description": "Медицинские технологии, здравоохранение"},
    {"id": "edtech", "name": "EdTech", "description": "Образовательные технологии, онлайн-обучение"},
    {"id": "ecommerce", "name": "E-commerce", "description": "Электронная коммерция, онлайн-ретейл"},
    {"id": "gaming", "name": "Gaming", "description": "Игровая индустрия, мобильные игры"},
    {"id": "saas", "name": "SaaS", "description": "Программное обеспечение как услуга"},
    {"id": "ai-ml", "name": "AI/ML", "description": "Искусственный интеллект и машинное обучение"},
    {"id": "sustainability", "name": "Sustainability", "description": "Устойчивое развитие, экологические технологии"}
]


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Регистрация нового пользователя"""
    
    # Проверяем, не существует ли пользователь
    if get_user_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Создаем пользователя
    user = create_user(db, user_data)
    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Логин пользователя"""
    
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return Token(
        access_token=access_token,
        user=UserRead.model_validate(user)
    )


@router.post("/domains", response_model=UserRead)
def set_user_domains(
    domain_data: UserDomainSelection,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Устанавливает интересующие пользователя домены (первичный онбординг)"""
    
    # Преобразуем ID доменов в полные названия (включая кастомные)
    normalized_domains = []
    for domain in domain_data.domains:
        if domain.startswith("custom:"):
            # Кастомный домен
            custom_name = domain.replace("custom:", "").strip()
            if len(custom_name) < 2 or len(custom_name) > 50:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Custom domain name must be between 2 and 50 characters"
                )
            normalized_domains.append(custom_name)
        elif domain in DOMAIN_MAPPING:
            normalized_domains.append(DOMAIN_MAPPING[domain])
        elif domain in DOMAIN_MAPPING.values():
            normalized_domains.append(domain)
        else:
            # Возможно это уже готовое название домена
            normalized_domains.append(domain)
    
    # Валидируем количество доменов
    if len(normalized_domains) < 1 or len(normalized_domains) > 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select 1-8 domains"
        )
    
    # Обновляем пользователя и завершаем онбординг
    current_user.selected_domains = normalized_domains
    current_user.onboarding_completed = True
    db.commit()
    db.refresh(current_user)
    
    return UserRead.model_validate(current_user)


@router.get("/me", response_model=UserRead)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Получить информацию о текущем пользователе"""
    return UserRead.model_validate(current_user)


@router.get("/available-domains")
def get_available_domains():
    """Получить список доступных доменов для выбора"""
    return {"domains": AVAILABLE_DOMAINS}


# НОВЫЕ РОУТЫ ДЛЯ УПРАВЛЕНИЯ ДОМЕНАМИ В ПРОФИЛЕ

@router.get("/profile/domains")
def get_user_profile_domains(current_user: User = Depends(get_current_user)):
    """Получение доменов пользователя для управления в профиле"""
    
    # Получаем текущие домены пользователя
    user_domains = current_user.selected_domains or []
    
    # Преобразуем полные названия обратно в ID для фронтенда
    selected_domains = []
    for domain_name in user_domains:
        # Ищем среди стандартных доменов
        domain_id = next((k for k, v in DOMAIN_MAPPING.items() if v == domain_name), None)
        
        if domain_id:
            # Стандартный домен
            domain_info = next((d for d in AVAILABLE_DOMAINS if d["name"] == domain_name), None)
            if domain_info:
                selected_domains.append({
                    "id": domain_id,
                    "name": domain_name,
                    "description": domain_info["description"],
                    "is_custom": False
                })
        else:
            # Кастомный домен
            selected_domains.append({
                "id": f"custom:{domain_name}",
                "name": domain_name,
                "description": "Custom domain",
                "is_custom": True
            })
    
    # Получаем доступные домены (все кроме уже выбранных)
    available_domains = [
        domain for domain in AVAILABLE_DOMAINS
        if domain["name"] not in user_domains
    ]
    
    return {
        "selected_domains": selected_domains,
        "available_domains": available_domains
    }


@router.post("/profile/domains/add", response_model=UserRead)
def add_user_domain(
    domain_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Добавление нового домена к профилю пользователя"""
    
    domain_id = domain_data.get("domain_id")
    if not domain_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Domain ID is required"
        )
    
    # Проверяем текущие домены
    current_domains = current_user.selected_domains or []
    
    # Проверяем лимит
    if len(current_domains) >= 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 8 domains allowed"
        )
    
    # Определяем тип домена
    if domain_id.startswith("custom:"):
        # Кастомный домен
        custom_name = domain_id.replace("custom:", "").strip()
        if len(custom_name) < 2 or len(custom_name) > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Custom domain name must be between 2 and 50 characters"
            )
        
        domain_name = custom_name
        
        # Проверяем, что кастомный домен еще не добавлен
        if domain_name in current_domains:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Domain already added"
            )
            
    else:
        # Стандартный домен
        if domain_id not in DOMAIN_MAPPING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid domain ID"
            )
        
        domain_name = DOMAIN_MAPPING[domain_id]
        
        # Проверяем, что домен еще не добавлен
        if domain_name in current_domains:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Domain already added"
            )
    
    # Добавляем новый домен
    current_user.selected_domains = current_domains + [domain_name]
    db.commit()
    db.refresh(current_user)
    
    return UserRead.model_validate(current_user)


@router.post("/profile/domains/custom", response_model=UserRead)
def add_custom_domain(
    domain_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание и добавление кастомного домена"""
    
    custom_name = domain_data.get("name", "").strip()
    if not custom_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Custom domain name is required"
        )
    
    if len(custom_name) < 2 or len(custom_name) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Custom domain name must be between 2 and 50 characters"
        )
    
    # Проверяем текущие домены
    current_domains = current_user.selected_domains or []
    
    # Проверяем лимит
    if len(current_domains) >= 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 8 domains allowed"
        )
    
    # Проверяем, что домен еще не добавлен
    if custom_name in current_domains:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Domain already exists"
        )
    
    # Проверяем, что не конфликтует со стандартными доменами
    if custom_name in DOMAIN_MAPPING.values():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This domain name conflicts with existing domains"
        )
    
    # Добавляем кастомный домен
    current_user.selected_domains = current_domains + [custom_name]
    db.commit()
    db.refresh(current_user)
    
    return UserRead.model_validate(current_user)


@router.delete("/profile/domains/remove", response_model=UserRead)
def remove_user_domain(
    domain_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удаление домена из профиля пользователя"""
    
    domain_id = domain_data.get("domain_id")
    if not domain_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Domain ID is required"
        )
    
    # Определяем название домена
    if domain_id.startswith("custom:"):
        # Кастомный домен
        domain_name = domain_id.replace("custom:", "").strip()
    else:
        # Стандартный домен
        if domain_id not in DOMAIN_MAPPING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid domain ID"
            )
        domain_name = DOMAIN_MAPPING[domain_id]
    
    # Проверяем текущие домены
    current_domains = current_user.selected_domains or []
    if domain_name not in current_domains:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Domain not found in user's domains"
        )
    
    # Проверяем, что остается хотя бы один домен
    if len(current_domains) <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one domain must remain"
        )
    
    # Удаляем домен
    current_user.selected_domains = [d for d in current_domains if d != domain_name]
    db.commit()
    db.refresh(current_user)
    
    return UserRead.model_validate(current_user) 