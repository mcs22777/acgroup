"""Proje ve Blok şemaları."""

from datetime import date
from uuid import UUID
from pydantic import BaseModel, Field


class BlockCreate(BaseModel):
    name: str = Field(max_length=100)
    total_floors: int | None = None


class BlockResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    total_floors: int | None
    model_config = {"from_attributes": True}


class ProjectCreate(BaseModel):
    name: str = Field(max_length=255)
    code: str = Field(max_length=50)
    city: str | None = None
    district: str | None = None
    address: str | None = None
    description: str | None = None
    status: str = "active"
    start_date: date | None = None
    expected_end: date | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    city: str | None = None
    district: str | None = None
    address: str | None = None
    description: str | None = None
    status: str | None = None
    start_date: date | None = None
    expected_end: date | None = None


class ProjectResponse(BaseModel):
    id: UUID
    name: str
    code: str
    city: str | None
    district: str | None
    address: str | None
    description: str | None
    total_units: int
    status: str
    start_date: date | None
    expected_end: date | None
    image_url: str | None
    blocks: list[BlockResponse] = []

    model_config = {"from_attributes": True}


class ProjectSummary(BaseModel):
    id: UUID
    name: str
    code: str
    total_units: int
    available: int
    reserved: int
    negotiation: int
    sold: int
