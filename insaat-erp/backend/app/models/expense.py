"""Firma gideri modeli."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Numeric, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin, TimestampMixin


class Expense(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "expenses"

    supplier_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("suppliers.id"), index=True
    )
    project_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id"), index=True
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    # malzeme, iscilik, kira, vergi, diger
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0)
    paid_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(
        String(50), default="pending", index=True
    )  # pending, paid, partial, overdue
    payment_method: Mapped[str | None] = mapped_column(String(50))
    invoice_no: Mapped[str | None] = mapped_column(String(100))
    notes: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )

    # İlişkiler
    supplier = relationship("Supplier", back_populates="expenses")
    project = relationship("Project")
