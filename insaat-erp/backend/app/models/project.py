"""Proje ve Blok modelleri."""

from datetime import date

from sqlalchemy import Date, Integer, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin, TimestampMixin


class Project(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "projects"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    city: Mapped[str | None] = mapped_column(String(100))
    district: Mapped[str | None] = mapped_column(String(100))
    address: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    total_units: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, completed, on_hold
    start_date: Mapped[date | None] = mapped_column(Date)
    expected_end: Mapped[date | None] = mapped_column(Date)
    image_url: Mapped[str | None] = mapped_column(String(500))

    # İlişkiler
    blocks = relationship("Block", back_populates="project", cascade="all, delete-orphan", lazy="selectin")
    units = relationship("Unit", back_populates="project", lazy="selectin")


class Block(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "blocks"

    project_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    total_floors: Mapped[int | None] = mapped_column(Integer)

    # İlişkiler
    project = relationship("Project", back_populates="blocks")
    units = relationship("Unit", back_populates="block", cascade="all, delete-orphan", lazy="selectin")
