"""Doküman modeli — dosya depolama referansları."""

from sqlalchemy import BigInteger, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin, TimestampMixin


class Document(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "documents"

    related_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # sale, contract, project, customer
    related_id: Mapped[str] = mapped_column(UUID(as_uuid=True), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)  # MinIO/S3 path
    file_size: Mapped[int | None] = mapped_column(BigInteger)
    mime_type: Mapped[str | None] = mapped_column(String(100))
    version: Mapped[int] = mapped_column(Integer, default=1)
    uploaded_by: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
