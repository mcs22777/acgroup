"""Satış modeli."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Integer, Numeric, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin, TimestampMixin


class Sale(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "sales"

    unit_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("units.id"), nullable=False
    )
    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False
    )
    opportunity_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("opportunities.id")
    )
    sale_date: Mapped[date] = mapped_column(Date, nullable=False)
    sale_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    down_payment: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0)
    remaining_debt: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    installment_count: Mapped[int] = mapped_column(Integer, default=0)
    payment_start_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, completed, cancelled
    notes: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )

    # İlişkiler
    unit = relationship("Unit", back_populates="sales")
    customer = relationship("Customer", back_populates="sales")
    installments = relationship(
        "Installment", back_populates="sale",
        cascade="all, delete-orphan",
        order_by="Installment.installment_no",
        lazy="selectin",
    )
    payments = relationship("Payment", back_populates="sale", lazy="selectin")
    contracts = relationship("Contract", back_populates="sale")
