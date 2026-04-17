"""AC Grup Proje ERP — FastAPI Ana Uygulama."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, Response

from app.core.config import get_settings
from app.api.v1 import api_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Uygulama başlangıç ve kapanış işlemleri."""
    # Startup
    print(f"🏗️  {settings.APP_NAME} v{settings.APP_VERSION} başlatılıyor...")
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
