"""Daire (Unit) şemaları."""

from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field


class UnitCreate(BaseModel):
    project_id: UUID
    block_id: UUID | None = None
    floor_number: int = Field(ge=0)
    unit_number: str = Field(max_length=20)
    room_type: str = Field(max_length=50)
    gross_area_m2: Decimal | None = None
    net_area_m2: Decimal | None = None
    list_price: Decimal = Field(gt=0)
    has_balcony: bool = False
    has_parking: bool = False
    direction: str | None = None
    notes: str | None = None


class UnitBulkCreate(BaseModel):
    """Toplu daire oluşturma."""
    project_id: UUID
    block_id: UUID | None = None
    start_floor: int = Field(ge=0)
    end_floor: int = Field(ge=0)
    units_per_floor: int = Field(ge=1, le=20)
    room_type: str
    gross_area_m2: Decimal | None = None
    net_area_m2: Decimal | None = None
    list_price: Decimal = Field(gt=0)


class UnitUpdate(BaseModel):
    room_type: str | None = None
    gross_area_m2: Decimal | None = None
    net_area_m2: Decimal | None = None
    list_price: Decimal | None = None
    has_balcony: bool | None = None
    has_parking: bool | None = None
    direction: str | None = None
    notes: str | None = None


class UnitStatusUpdate(BaseModel):
    status: str  # available, reserved, negotiation, sold
    notes: str | None = None


class UnitResponse(BaseModel):
    id: UUID
    project_id: UUID
    block_id: UUID | None
    floor_number: int
    unit_number: str
    room_type: str
    gross_area_m2: Decimal | None
    net_area_m2: Decimal | None
    list_price: Decimal
    status: str
    has_balcony: bool
    has_parking: bool
    direction: str | None
    notes: str | None

    model_config = {"from_attributes": True}
