"""Tedarikçi ve Gider şemaları."""

from datetime import date
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field


class SupplierCreate(BaseModel):
    name: str = Field(max_length=255)
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    tax_number: str | None = None
    address: str | None = None
    category: str | None = None
    notes: str | None = None


class SupplierResponse(BaseModel):
    id: UUID
    name: str
    contact_person: str | None
    phone: str | None
    email: str | None
    tax_number: str | None
    category: str | None
    notes: str | None

    model_config = {"from_attributes": True}


class ExpenseCreate(BaseModel):
    supplier_id: UUID | None = None
    project_id: UUID | None = None
    category: str = Field(max_length=100)
    description: str = Field(max_length=500)
    amount: Decimal = Field(gt=0)
    due_date: date
    invoice_no: str | None = None
    notes: str | None = None


class ExpenseUpdate(BaseModel):
    category: str | None = None
    description: str | None = None
    amount: Decimal | None = None
    due_date: date | None = None
    invoice_no: str | None = None
    notes: str | None = None


class ExpensePayment(BaseModel):
    paid_amount: Decimal = Field(gt=0)
    paid_date: date
    payment_method: str | None = None


class ExpenseResponse(BaseModel):
    id: UUID
    supplier_id: UUID | None
    project_id: UUID | None
    category: str
    description: str
    amount: Decimal
    due_date: date
    paid_amount: Decimal
    paid_date: date | None
    status: str
    payment_method: str | None
    invoice_no: str | None
    notes: str | None

    model_config = {"from_attributes": True}
