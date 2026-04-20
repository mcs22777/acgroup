"""Müşteri ve Fırsat şemaları."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field


class CustomerCreate(BaseModel):
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    phone: str = Field(max_length=20)
    phone_secondary: str | None = None
    email: str | None = None
    tc_kimlik_no: str | None = None
    address: str | None = None
    source: str | None = None
    notes: str | None = None
    assigned_to: UUID | None = None


class CustomerUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    phone_secondary: str | None = None
    email: str | None = None
    tc_kimlik_no: str | None = None
    address: str | None = None
    source: str | None = None
    notes: str | None = None
    assigned_to: UUID | None = None


class CustomerResponse(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    phone: str
    phone_secondary: str | None
    email: str | None
    tc_kimlik_no: str | None
    address: str | None
    source: str | None
    notes: str | None
    assigned_to: UUID | None

    model_config = {"from_attributes": True}


class OpportunityCreate(BaseModel):
    customer_id: UUID
    project_id: UUID | None = None
    unit_id: UUID | None = None
    offered_price: Decimal | None = None
    priority: str = "medium"
    expected_close: date | None = None
    notes: str | None = None
    assigned_to: UUID | None = None


class OpportunityUpdate(BaseModel):
    project_id: UUID | None = None
    unit_id: UUID | None = None
    offered_price: Decimal | None = None
    priority: str | None = None
    expected_close: date | None = None
    notes: str | None = None
    status: str | None = None
    loss_reason: str | None = None


class OpportunityResponse(BaseModel):
    id: UUID
    customer_id: UUID
    project_id: UUID | None
    unit_id: UUID | None
    offered_price: Decimal | None
    status: str
    priority: str
    expected_close: date | None
    loss_reason: str | None
    notes: str | None
    assigned_to: UUID | None

    model_config = {"from_attributes": True}


class ActivityCreate(BaseModel):
    customer_id: UUID
    opportunity_id: UUID | None = None
    activity_type: str  # call, meeting, email, note, site_visit
    subject: str | None = None
    description: str | None = None
    activity_date: datetime | None = None
    next_action: str | None = None
    next_action_date: date | None = None


class ActivityResponse(BaseModel):
    id: UUID
    customer_id: UUID
    opportunity_id: UUID | None
    user_id: UUID
    activity_type: str
    subject: str | None
    description: str | None
    activity_date: datetime
    next_action: str | None
    next_action_date: date | None

    model_config = {"from_attributes": True}
