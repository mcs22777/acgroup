"""Satış Fırsatı (Opportunity) modeli."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Numeric, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin, TimestampMixin


class Opportunity(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "opportunities"

    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False, index=True
    )
    project_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id")
    )
    unit_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("units.id")
    )
    offered_price: Mapped[Decimal | None] = mapped_column(Numeric(15, 2))
    status: Mapped[str] = mapped_column(
        String(50), default="new", index=True
    )  # new, contacted, proposal_sent, negotiation, won, lost
    priority: Mapped[str] = mapped_column(String(20), default="medium")  # low, medium, high
    expected_close: Mapped[date | None] = mapped_column(Date)
    loss_reason: Mapped[str | None] = mapped_column(Text)
    assigned_to: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    notes: Mapped[str | None] = mapped_column(Text)

    # İlişkiler
    customer = relationship("Customer", back_populates="opportunities")
    project = relationship("Project")
    unit = relationship("Unit", back_populates="opportunities")
    activities = relationship("Activity", back_populates="opportunity")
