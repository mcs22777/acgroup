"""API v1 router — tüm modül route'larını birleştirir."""

from fastapi import APIRouter

from app.api.v1 import auth, projects, units, customers, sales, expenses, dashboard

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projeler"])
api_router.include_router(units.router, prefix="/units", tags=["Daireler"])
api_router.include_router(customers.router, prefix="/customers", tags=["Müşteriler"])
api_router.include_router(sales.router, prefix="/sales", tags=["Satışlar"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["Giderler"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
