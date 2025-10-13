from sqlalchemy.orm import Session
from passlib.context import CryptContext
import hashlib

from ..models import User
from ..schemas.auth import UserRegister

# Use bcrypt as primary, with argon2 as fallback for very long passwords
pwd_context = CryptContext(schemes=["bcrypt", "argon2"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Хэширует пароль"""
    # For passwords longer than 72 bytes, use SHA-256 hash first, then bcrypt
    if len(password.encode('utf-8')) > 72:
        # Hash the password with SHA-256 first to get a fixed 32-byte hash
        password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
        return pwd_context.hash(password_hash)
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет пароль"""
    # For passwords longer than 72 bytes, use SHA-256 hash first, then verify
    if len(plain_password.encode('utf-8')) > 72:
        # Hash the password with SHA-256 first to get a fixed 32-byte hash
        password_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
        return pwd_context.verify(password_hash, hashed_password)
    return pwd_context.verify(plain_password, hashed_password)


def get_user_by_email(db: Session, email: str) -> User | None:
    """Получает пользователя по email"""
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user_data: UserRegister) -> User:
    """Создает нового пользователя"""
    hashed_password = get_password_hash(user_data.password)
    
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        selected_domains=None,
        onboarding_completed=False
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Аутентифицирует пользователя"""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user 