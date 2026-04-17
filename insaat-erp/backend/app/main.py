"""AC Grup Proje ERP — FastAPI Ana Uygulama."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, Response

from app.core.config import get_settings
from app.api.v1 import api_router

settings = get_settings()
logger = logging.getLogger(__name__)

# Logging ayarı
logging.basicConfig(level=logging.DEBUG if settings.DEBUG else logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Uygulama başlangıç ve kapanış işlemleri."""
    # Startup
    print(f"🏗️  {settings.APP_NAME} v{settings.APP_VERSION} başlatılıyor...")
    # DB bağlantı kontrolü
    try:
        from app.db.session import engine
        async with engine.connect() as conn:
            from sqlalchemy import text
            await conn.execute(text("SELECT 1"))
        print("✅ Veritabanı bağlantısı başarılı")
    except Exception as e:
        print(f"❌ Veritabanı bağlantı hatası: {e}")
    yield
    # Shutdown
    print("Uygulama kapatılıyor...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="İnşaat Firması ERP — CRM, Stok ve Finans Yönetimi",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler — 500 hatalarının detayını logla
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"İşlenmeyen hata [{request.method} {request.url.path}]: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Sunucu hatası: {str(exc)}"},
    )

# API Routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", include_in_schema=False)
async def root():
    """Ana sayfa — bilgi mesajı."""
    return {
        "message": f"{settings.APP_NAME} Backend API",
        "frontend": "http://localhost:3000",
        "docs": "http://localhost:8000/docs",
        "health": "http://localhost:8000/health",
    }


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Tarayıcı favicon isteklerini sustur."""
    return Response(status_code=204)


@app.get("/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}
