"""Tedarikçi ve Gider endpoint'leri."""

from datetime import date as date_type
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select, delete as sa_delete

from app.core.dependencies import DB, CurrentUser
from app.models.supplier import Supplier
from app.models.expense import Expense
from app.models.expense_installment import ExpenseInstallment
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


@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(supplier_id: UUID, body: dict, db: DB, current_user: CurrentUser):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Tedarikçi bulunamadı")
    allowed = {"name", "contact_person", "phone", "email", "tax_number", "address", "category", "notes"}
    for key, value in body.items():
        if key in allowed:
            setattr(supplier, key, value)
    await db.flush()
    return supplier


@router.delete("/suppliers/{supplier_id}", status_code=204)
async def delete_supplier(supplier_id: UUID, db: DB, current_user: CurrentUser):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Tedarikçi bulunamadı")
    await db.delete(supplier)
    await db.flush()


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


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(expense_id: UUID, db: DB, current_user: CurrentUser):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Gider bulunamadı")
    await db.delete(expense)
    await db.flush()


# ── Gider Taksitleri ──


@router.post("/{expense_id}/installments")
async def create_expense_installment_plan(
    expense_id: UUID, body: dict, db: DB, current_user: CurrentUser
):
    """Gider için aya yayılan ödeme planı oluşturur."""
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Gider bulunamadı")

    count = body.get("count", 1)
    start_date_str = body.get("start_date")
    if not start_date_str or count < 1:
        raise HTTPException(status_code=400, detail="count ve start_date gerekli")

    start_date = date_type.fromisoformat(start_date_str)
    total = Decimal(str(expense.amount))
    monthly = (total / count).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    await db.execute(
        sa_delete(ExpenseInstallment).where(ExpenseInstallment.expense_id == expense_id)
    )

    items = []
    running_total = Decimal("0")
    for i in range(count):
        due = start_date + relativedelta(months=i)
        if i == count - 1:
            amt = total - running_total
        else:
            amt = monthly
            running_total += amt
        inst = ExpenseInstallment(
            expense_id=expense_id, installment_no=i + 1,
            due_date=due, amount=amt, paid_amount=0, status="pending",
        )
        db.add(inst)
        items.append(inst)

    await db.flush()
    return [
        {"id": str(it.id), "expense_id": str(it.expense_id), "installment_no": it.installment_no,
         "due_date": str(it.due_date), "amount": float(it.amount), "paid_amount": float(it.paid_amount),
         "paid_date": None, "status": it.status}
        for it in items
    ]


@router.get("/{expense_id}/installments")
async def get_expense_installments(expense_id: UUID, db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(ExpenseInstallment)
        .where(ExpenseInstallment.expense_id == expense_id)
        .order_by(ExpenseInstallment.installment_no)
    )
    items = result.scalars().all()
    return [
        {"id": str(it.id), "expense_id": str(it.expense_id), "installment_no": it.installment_no,
         "due_date": str(it.due_date), "amount": float(it.amount), "paid_amount": float(it.paid_amount),
         "paid_date": str(it.paid_date) if it.paid_date else None, "status": it.status}
        for it in items
    ]


@router.patch("/{expense_id}/installments/{installment_id}")
async def update_expense_installment(
    expense_id: UUID, installment_id: UUID, body: dict, db: DB, current_user: CurrentUser
):
    result = await db.execute(
        select(ExpenseInstallment).where(
            ExpenseInstallment.id == installment_id,
            ExpenseInstallment.expense_id == expense_id,
        )
    )
    inst = result.scalar_one_or_none()
    if not inst:
        raise HTTPException(status_code=404, detail="Taksit bulunamadı")

    allowed = {"due_date", "amount", "status", "paid_amount", "paid_date", "notes"}
    for key, value in body.items():
        if key in allowed:
            if key in ("due_date", "paid_date") and value:
                value = date_type.fromisoformat(value)
            if key in ("amount", "paid_amount") and value is not None:
                value = Decimal(str(value))
            setattr(inst, key, value)

    await db.flush()

    all_inst = await db.execute(
        select(ExpenseInstallment).where(ExpenseInstallment.expense_id == expense_id)
    )
    total_paid = sum(Decimal(str(i.paid_amount or 0)) for i in all_inst.scalars().all())
    expense_result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = expense_result.scalar_one_or_none()
    if expense:
        expense.paid_amount = total_paid
        if expense.paid_amount >= expense.amount:
            expense.status = "paid"
        elif expense.paid_amount > 0:
            expense.status = "partial"
        else:
            expense.status = "pending"
        await db.flush()

    return {
        "id": str(inst.id), "expense_id": str(inst.expense_id),
        "installment_no": inst.installment_no, "due_date": str(inst.due_date),
        "amount": float(inst.amount), "paid_amount": float(inst.paid_amount),
        "paid_date": str(inst.paid_date) if inst.paid_date else None,
        "status": inst.status,
    }
