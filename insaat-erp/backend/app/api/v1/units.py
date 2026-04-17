"""Daire (Unit) endpoint'leri."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.core.dependencies import DB, CurrentUser
from app.models.unit import Unit
from app.schemas.unit import (
    UnitCreate, UnitBulkCreate, UnitUpdate, UnitStatusUpdate, UnitResponse,
)

router = APIRouter()

VALID_STATUSES = {"available", "reserved", "negotiation", "sold"}
VALID_TRANSITIONS = {
    "available": {"reserved", "negotiation"},
    "reserved": {"available", "negotiation", "sold"},
    "negotiation": {"available", "reserved", "sold"},
    "sold": {"available"},  # İptal durumunda geri çevrilebilir
}


@router.get("", response_model=list[UnitResponse])
async def list_units(
    db: DB,
    current_user: CurrentUser,
    project_id: UUID | None = None,
    block_id: UUID | None = None,
    unit_status: str | None = Query(None, alias="status"),
    room_type: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    query = select(Unit)
    if project_id:
        query = query.where(Unit.project_id == project_id)
    if block_id:
        query = query.where(Unit.block_id == block_id)
    if unit_status:
        query = query.where(Unit.status == unit_status)
    if room_type:
        query = query.where(Unit.room_type == room_type)

    query = query.order_by(Unit.floor_number, Unit.unit_number)
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=UnitResponse, status_code=201)
async def create_unit(body: UnitCreate, db: DB, current_user: CurrentUser):
    unit = Unit(**body.model_dump())
    db.add(unit)
    await db.flush()
    return unit


@router.post("/bulk", response_model=list[UnitResponse], status_code=201)
async def create_units_bulk(body: UnitBulkCreate, db: DB, current_user: CurrentUser):
    """Toplu daire oluşturma — kat ve daire sayısına göre."""
    units = []
    for floor in range(body.start_floor, body.end_floor + 1):
        for unit_num in range(1, body.units_per_floor + 1):
            unit = Unit(
                project_id=body.project_id,
                block_id=body.block_id,
                floor_number=floor,
                unit_number=f"{floor}{unit_num:02d}",
                room_type=body.room_type,
                gross_area_m2=body.gross_area_m2,
                net_area_m2=body.net_area_m2,
                list_price=body.list_price,
                status="available",
            )
            db.add(unit)
            units.append(unit)

    await db.flush()
    return units


@router.get("/{unit_id}", response_model=UnitResponse)
async def get_unit(unit_id: UUID, db: DB, current_user: CurrentUser):
    result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = result.scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=404, detail="Daire bulunamadı")
    return unit


@router.put("/{unit_id}", response_model=UnitResponse)
async def update_unit(unit_id: UUID, body: UnitUpdate, db: DB, current_user: CurrentUser):
    result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = result.scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=404, detail="Daire bulunamadı")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(unit, key, value)
    await db.flush()
    return unit


@router.patch("/{unit_id}/status", response_model=UnitResponse)
async def update_unit_status(unit_id: UUID, body: UnitStatusUpdate, db: DB, current_user: CurrentUser):
    """Daire durum geçişi — state machine kontrolü."""
    result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = result.scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=404, detail="Daire bulunamadı")

    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Geçersiz durum: {body.status}")

    allowed = VALID_TRANSITIONS.get(unit.status, set())
    if body.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"'{unit.status}' durumundan '{body.status}' durumuna geçiş yapılamaz",
        )

    unit.status = body.status
    if body.notes:
        unit.notes = body.notes
    await db.flush()
    return unit
