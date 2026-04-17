"""Proje endpoint'leri."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, func

from app.core.dependencies import DB, CurrentUser
from app.models.project import Project, Block
from app.models.unit import Unit
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    ProjectSummary, BlockCreate, BlockResponse,
)

router = APIRouter()


@router.get("", response_model=list[ProjectResponse])
async def list_projects(db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Project).order_by(Project.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(body: ProjectCreate, db: DB, current_user: CurrentUser):
    existing = await db.execute(select(Project).where(Project.code == body.code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Bu proje kodu zaten mevcut")

    project = Project(**body.model_dump())
    db.add(project)
    await db.flush()
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: UUID, db: DB, current_user: CurrentUser):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: UUID, body: ProjectUpdate, db: DB, current_user: CurrentUser):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    await db.flush()
    return project


@router.get("/{project_id}/summary", response_model=ProjectSummary)
async def get_project_summary(project_id: UUID, db: DB, current_user: CurrentUser):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")

    # Durum bazlı sayım
    counts = await db.execute(
        select(Unit.status, func.count(Unit.id))
        .where(Unit.project_id == project_id)
        .group_by(Unit.status)
    )
    status_counts = dict(counts.all())

    return ProjectSummary(
        id=project.id,
        name=project.name,
        code=project.code,
        total_units=sum(status_counts.values()),
        available=status_counts.get("available", 0),
        reserved=status_counts.get("reserved", 0),
        negotiation=status_counts.get("negotiation", 0),
        sold=status_counts.get("sold", 0),
    )


# ── Bloklar ──

@router.get("/{project_id}/blocks", response_model=list[BlockResponse])
async def list_blocks(project_id: UUID, db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Block).where(Block.project_id == project_id).order_by(Block.name)
    )
    return result.scalars().all()


@router.post("/{project_id}/blocks", response_model=BlockResponse, status_code=201)
async def create_block(project_id: UUID, body: BlockCreate, db: DB, current_user: CurrentUser):
    # Proje varlık kontrolü
    project = await db.execute(select(Project).where(Project.id == project_id))
    if not project.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Proje bulunamadı")

    block = Block(project_id=project_id, **body.model_dump())
    db.add(block)
    await db.flush()
    return block
