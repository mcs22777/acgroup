"""Gider taksit modeli."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Integer, Numeric, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin, TimestampMixin


class ExpenseInstallment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "expense_installments"

    expense_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("expenses.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    installment_no: Mapped[int] = mapped_column(Integer, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0)
    paid_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    notes: Mapped[str | None] = mapped_column(Text)

    expense = relationship("Expense", back_populates="installments")
