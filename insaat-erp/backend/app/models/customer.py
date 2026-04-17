"""Müşteri modeli."""

from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin, TimestampMixin


class Customer(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "customers"

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    phone_secondary: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(255))
    tc_kimlik_no: Mapped[str | None] = mapped_column(String(11))
    address: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str | None] = mapped_column(String(50))  # web, referral, walk_in, phone, ad
    notes: Mapped[str | None] = mapped_column(Text)
    assigned_to: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )

    # İlişkiler
    opportunities = relationship("Opportunity", back_populates="customer", lazy="selectin")
    activities = relationship("Activity", back_populates="customer", lazy="selectin")
    sales = relationship("Sale", back_populates="customer")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
