"""Ödeme (tahsilat) modeli."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Numeric, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin, TimestampMixin


class Payment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "payments"

    sale_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sales.id"), nullable=False
    )
    installment_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("installments.id")
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    payment_method: Mapped[str | None] = mapped_column(String(50))  # cash, bank_transfer, credit_card, check
    reference_no: Mapped[str | None] = mapped_column(String(100))
    notes: Mapped[str | None] = mapped_column(Text)
    recorded_by: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )

    # İlişkiler
    sale = relationship("Sale", back_populates="payments")
    installment = relationship("Installment", back_populates="payments")
