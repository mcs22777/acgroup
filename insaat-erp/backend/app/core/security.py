"""JWT token yönetimi ve şifre hashing."""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# passlib + bcrypt uyumluluk — bcrypt 4.1+ ile passlib sorun çıkarabiliyor
try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    _use_passlib = True
    logger.info("passlib+bcrypt başarıyla yüklendi")
except Exception as e:
    logger.warning(f"passlib yüklenemedi ({e}), doğrudan bcrypt kullanılacak")
    _use_passlib = False

import bcrypt as _bcrypt


def hash_password(password: str) -> str:
    if _use_passlib:
        try:
            return pwd_context.hash(password)
        except Exception:
            pass
    # Fallback: doğrudan bcrypt
    return _bcrypt.hashpw(password.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if _use_passlib:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.warning(f"passlib verify hatası ({e}), doğrudan bcrypt deneniyor")
    # Fallback: doğrudan bcrypt
    try:
        return _bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception as e:
        logger.error(f"bcrypt verify hatası: {e}")
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
