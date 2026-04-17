"""Aktivite / İletişim Geçmişi modeli."""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin, TimestampMixin


class Activity(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "activities"

    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False, index=True
    )
    opportunity_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("opportunities.id")
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    activity_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # call, meeting, email, note, site_visit
    subject: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    activity_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    next_action: Mapped[str | None] = mapped_column(Text)
    next_action_date: Mapped[date | None] = mapped_column(Date)

    # İlişkiler
    customer = relationship("Customer", back_populates="activities")
    opportunity = relationship("Opportunity", back_populates="activities")
    user = relationship("User", back_populates="activities")
