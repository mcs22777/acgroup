"""Tedarikçi ve Gider endpoint'leri."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from app.core.dependencies import DB, CurrentUser
from app.models.supplier import Supplier
from app.models.expense import Expense
from app.schemas.expense import (
    SupplierCreate, SupplierResponse,
    ExpenseCreate, ExpenseUpdate, ExpensePayment, ExpenseResponse,
)

router = APIRouter()


# ── Tedarikçiler ──

@router.get("/suppliers", response_model=list[SupplierResponse])
async def list_suppliers(db: DB, current_user: CurrentUser):
    result = await db.execute(select(Supplier).order_by(Supplier.name))
    return result.scalars().all()


@router.post("/suppliers", response_model=SupplierResponse, status_code=201)
async def create_supplier(body: SupplierCreate, db: DB, current_user: CurrentUser):
    supplier = Supplier(**body.model_dump())
    db.add(supplier)
    await db.flush()
    return supplier


# ── Giderler ──

@router.get("", response_model=list[ExpenseResponse])
async def list_expenses(
    db: DB,
    current_user: CurrentUser,
    expense_status: str | None = Query(None, alias="status"),
    project_id: UUID | None = None,
    supplier_id: UUID | None = None,
    category: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    query = select(Expense)
    if expense_status:
        query = query.where(Expense.status == expense_status)
    if project_id:
        query = query.where(Expense.project_id == project_id)
    if supplier_id:
        query = query.where(Expense.supplier_id == supplier_id)
    if category:
        query = query.where(Expense.category == category)

    query = query.order_by(Expense.due_date.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=ExpenseResponse, status_code=201)
async def create_expense(body: ExpenseCreate, db: DB, current_user: CurrentUser):
    expense = Expense(
        **body.model_dump(),
        created_by=current_user.id,
        paid_amount=0,
        status="pending",
    )
    db.add(expense)
    await db.flush()
    return expense


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(expense_id: UUID, body: ExpenseUpdate, db: DB, current_user: CurrentUser):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Gider bulunamadı")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(expense, key, value)
    await db.flush()
    return expense


@router.patch("/{expense_id}/pay", response_model=ExpenseResponse)
async def pay_expense(expense_id: UUID, body: ExpensePayment, db: DB, current_user: CurrentUser):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Gider bulunamadı")

    expense.paid_amount += body.paid_amount
    expense.paid_date = body.paid_date
    if body.payment_method:
        expense.payment_method = body.payment_method

    if expense.paid_amount >= expense.amount:
        expense.status = "paid"
    else:
        expense.status = "partial"

    await db.flush()
    return expense
