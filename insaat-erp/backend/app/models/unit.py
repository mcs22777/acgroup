"""Daire (Unit) modeli."""

from decimal import Decimal

from sqlalchemy import Boolean, Integer, Numeric, String, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin, TimestampMixin


class Unit(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "units"
    __table_args__ = (
        UniqueConstraint("project_id", "block_id", "floor_number", "unit_number", name="uq_unit_identity"),
    )

    project_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True
    )
    block_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("blocks.id")
    )
    floor_number: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_number: Mapped[str] = mapped_column(String(20), nullable=False)
    room_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "2+1", "3+1", "4+1"
    gross_area_m2: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    net_area_m2: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    list_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default="available", index=True
    )  # available, reserved, negotiation, sold
    has_balcony: Mapped[bool] = mapped_column(Boolean, default=False)
    has_parking: Mapped[bool] = mapped_column(Boolean, default=False)
    direction: Mapped[str | None] = mapped_column(String(50))  # Güney, Kuzey-Batı
    notes: Mapped[str | None] = mapped_column(Text)

    # İlişkiler
    project = relationship("Project", back_populates="units")
    block = relationship("Block", back_populates="units")
    sales = relationship("Sale", back_populates="unit")
    opportunities = relationship("Opportunity", back_populates="unit")
