"""Satış, Taksit ve Ödeme şemaları."""

from datetime import date
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field


class SaleCreate(BaseModel):
    unit_id: UUID
    customer_id: UUID
    opportunity_id: UUID | None = None
    sale_date: date
    sale_price: Decimal = Field(gt=0)
    down_payment: Decimal = Field(ge=0, default=0)
    installment_count: int = Field(ge=0, default=0)
    payment_start_date: date | None = None
    notes: str | None = None


class InstallmentResponse(BaseModel):
    id: UUID
    sale_id: UUID
    installment_no: int
    due_date: date
    amount: Decimal
    paid_amount: Decimal
    paid_date: date | None
    status: str

    model_config = {"from_attributes": True}


class SaleResponse(BaseModel):
    id: UUID
    unit_id: UUID
    customer_id: UUID
    sale_date: date
    sale_price: Decimal
    down_payment: Decimal
    remaining_debt: Decimal
    installment_count: int
    payment_start_date: date | None
    status: str
    notes: str | None
    installments: list[InstallmentResponse] = []

    model_config = {"from_attributes": True}


class PaymentCreate(BaseModel):
    sale_id: UUID
    installment_id: UUID | None = None
    amount: Decimal = Field(gt=0)
    payment_date: date
    payment_method: str | None = None
    reference_no: str | None = None
    notes: str | None = None


class PaymentResponse(BaseModel):
    id: UUID
    sale_id: UUID
    installment_id: UUID | None
    amount: Decimal
    payment_date: date
    payment_method: str | None
    reference_no: str | None
    notes: str | None

    model_config = {"from_attributes": True}
