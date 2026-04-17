"""Sözleşme şablonu ve sözleşme modelleri."""

from datetime import date

from sqlalchemy import Boolean, Date, Integer, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin, TimestampMixin


class ContractTemplate(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "contract_templates"

    project_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    content_html: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # İlişkiler
    project = relationship("Project")
    contracts = relationship("Contract", back_populates="template")


class Contract(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "contracts"

    sale_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sales.id"), nullable=False
    )
    template_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contract_templates.id")
    )
    contract_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    content_html: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, signed, cancelled
    signed_date: Mapped[date | None] = mapped_column(Date)

    # İlişkiler
    sale = relationship("Sale", back_populates="contracts")
    template = relationship("ContractTemplate", back_populates="contracts")
