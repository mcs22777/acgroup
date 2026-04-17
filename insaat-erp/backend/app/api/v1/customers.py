"""Müşteri, Fırsat ve Aktivite endpoint'leri."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from app.core.dependencies import DB, CurrentUser
from app.models.customer import Customer
from app.models.opportunity import Opportunity
from app.models.activity import Activity
from app.schemas.customer import (
    CustomerCreate, CustomerUpdate, CustomerResponse,
    OpportunityCreate, OpportunityUpdate, OpportunityResponse,
    ActivityCreate, ActivityResponse,
)

router = APIRouter()


# ── Müşteriler ──

@router.get("", response_model=list[CustomerResponse])
async def list_customers(
    db: DB,
    current_user: CurrentUser,
    search: str | None = None,
    source: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    query = select(Customer)
    if search:
        like = f"%{search}%"
        query = query.where(
            (Customer.first_name.ilike(like))
            | (Customer.last_name.ilike(like))
            | (Customer.phone.ilike(like))
        )
    if source:
        query = query.where(Customer.source == source)

    query = query.order_by(Customer.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer(body: CustomerCreate, db: DB, current_user: CurrentUser):
    customer = Customer(**body.model_dump())
    if not customer.assigned_to:
        customer.assigned_to = current_user.id
    db.add(customer)
    await db.flush()
    return customer


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: UUID, db: DB, current_user: CurrentUser):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: UUID, body: CustomerUpdate, db: DB, current_user: CurrentUser):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Müşteri bulunamadı")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(customer, key, value)
    await db.flush()
    return customer


# ── Fırsatlar ──

@router.get("/opportunities/all", response_model=list[OpportunityResponse])
async def list_all_opportunities(db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Opportunity).order_by(Opportunity.created_at.desc())
    )
    return result.scalars().all()


@router.get("/activities/all", response_model=list[ActivityResponse])
async def list_all_activities(db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Activity).order_by(Activity.activity_date.desc()).limit(50)
    )
    return result.scalars().all()


@router.get("/{customer_id}/opportunities", response_model=list[OpportunityResponse])
async def list_customer_opportunities(customer_id: UUID, db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Opportunity)
        .where(Opportunity.customer_id == customer_id)
        .order_by(Opportunity.created_at.desc())
    )
    return result.scalars().all()


@router.post("/opportunities", response_model=OpportunityResponse, status_code=201)
async def create_opportunity(body: OpportunityCreate, db: DB, current_user: CurrentUser):
    opp = Opportunity(**body.model_dump())
    if not opp.assigned_to:
        opp.assigned_to = current_user.id
    db.add(opp)
    await db.flush()
    return opp


@router.put("/opportunities/{opp_id}", response_model=OpportunityResponse)
async def update_opportunity(opp_id: UUID, body: OpportunityUpdate, db: DB, current_user: CurrentUser):
    result = await db.execute(select(Opportunity).where(Opportunity.id == opp_id))
    opp = result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Fırsat bulunamadı")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(opp, key, value)
    await db.flush()
    return opp


# ── Aktiviteler ──

@router.get("/{customer_id}/activities", response_model=list[ActivityResponse])
async def list_customer_activities(customer_id: UUID, db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Activity)
        .where(Activity.customer_id == customer_id)
        .order_by(Activity.activity_date.desc())
    )
    return result.scalars().all()


@router.post("/activities", response_model=ActivityResponse, status_code=201)
async def create_activity(body: ActivityCreate, db: DB, current_user: CurrentUser):
    activity = Activity(
        **body.model_dump(exclude={"activity_date"}),
        user_id=current_user.id,
        activity_date=body.activity_date or datetime.now(timezone.utc),
    )
    db.add(activity)
    await db.flush()
    return activity
