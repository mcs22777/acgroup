"""Satış, Taksit ve Ödeme endpoint'leri."""

from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from app.core.dependencies import DB, CurrentUser
from app.models.sale import Sale
from app.models.installment import Installment
from app.models.payment import Payment
from app.models.unit import Unit
from app.models.opportunity import Opportunity
from app.schemas.sale import (
    SaleCreate, SaleResponse, InstallmentResponse,
    PaymentCreate, PaymentResponse,
)

router = APIRouter()


def generate_installment_plan(
    remaining_debt: Decimal,
    count: int,
    start_date: date,
) -> list[dict]:
    """Eşit taksitli ödeme planı üretir."""
    monthly = (remaining_debt / count).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    plan = []
    total = Decimal("0")

    for i in range(count):
        due = start_date + relativedelta(months=i)
        if i == count - 1:
            amount = remaining_debt - total
        else:
            amount = monthly
            total += amount

        plan.append({
            "installment_no": i + 1,
            "due_date": due,
            "amount": amount,
            "status": "pending",
        })
    return plan


@router.get("", response_model=list[SaleResponse])
async def list_sales(
    db: DB,
    current_user: CurrentUser,
    unit_status: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    query = select(Sale).order_by(Sale.sale_date.desc())
    if unit_status:
        query = query.where(Sale.status == unit_status)
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=SaleResponse, status_code=201)
async def create_sale(body: SaleCreate, db: DB, current_user: CurrentUser):
    # Daire kontrolü
    unit_result = await db.execute(select(Unit).where(Unit.id == body.unit_id))
    unit = unit_result.scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=404, detail="Daire bulunamadı")
    if unit.status == "sold":
        raise HTTPException(status_code=400, detail="Bu daire zaten satılmış")

    remaining = body.sale_price - body.down_payment
    if remaining < 0:
        raise HTTPException(status_code=400, detail="Peşinat satış bedelini aşamaz")

    # Satış oluştur
    sale = Sale(
        unit_id=body.unit_id,
        customer_id=body.customer_id,
        opportunity_id=body.opportunity_id,
        sale_date=body.sale_date,
        sale_price=body.sale_price,
        down_payment=body.down_payment,
        remaining_debt=remaining,
        installment_count=body.installment_count,
        payment_start_date=body.payment_start_date,
        notes=body.notes,
        created_by=current_user.id,
        status="active",
    )
    db.add(sale)
    await db.flush()

    # Taksit planı oluştur
    if body.installment_count > 0 and remaining > 0 and body.payment_start_date:
        plan = generate_installment_plan(remaining, body.installment_count, body.payment_start_date)
        for item in plan:
            installment = Installment(sale_id=sale.id, **item)
            db.add(installment)

    # Daire durumunu güncelle
    unit.status = "sold"

    # Fırsatı güncelle
    if body.opportunity_id:
        opp_result = await db.execute(
            select(Opportunity).where(Opportunity.id == body.opportunity_id)
        )
        opp = opp_result.scalar_one_or_none()
        if opp:
            opp.status = "won"

    await db.flush()
    # Taksitleri yükle
    await db.refresh(sale, ["installments"])
    return sale


@router.get("/{sale_id}", response_model=SaleResponse)
async def get_sale(sale_id: UUID, db: DB, current_user: CurrentUser):
    result = await db.execute(select(Sale).where(Sale.id == sale_id))
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=404, detail="Satış bulunamadı")
    return sale


@router.put("/{sale_id}", response_model=SaleResponse)
async def update_sale(sale_id: UUID, body: dict, db: DB, current_user: CurrentUser):
    result = await db.execute(select(Sale).where(Sale.id == sale_id))
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=404, detail="Satış bulunamadı")
    allowed = {"sale_price", "down_payment", "notes", "status"}
    for key, value in body.items():
        if key in allowed:
            if key in ("sale_price", "down_payment"):
                value = Decimal(str(value))
            setattr(sale, key, value)
    await db.flush()
    await db.refresh(sale, ["installments"])
    return sale


@router.delete("/{sale_id}", status_code=204)
async def delete_sale(sale_id: UUID, db: DB, current_user: CurrentUser):
    result = await db.execute(select(Sale).where(Sale.id == sale_id))
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=404, detail="Satış bulunamadı")
    unit_result = await db.execute(select(Unit).where(Unit.id == sale.unit_id))
    unit = unit_result.scalar_one_or_none()
    if unit:
        unit.status = "available"
    await db.delete(sale)
    await db.flush()


@router.get("/{sale_id}/installments", response_model=list[InstallmentResponse])
async def get_sale_installments(sale_id: UUID, db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Installment)
        .where(Installment.sale_id == sale_id)
        .order_by(Installment.installment_no)
    )
    return result.scalars().all()


@router.patch("/{sale_id}/installments/{installment_id}")
async def update_installment(
    sale_id: UUID, installment_id: UUID, body: dict, db: DB, current_user: CurrentUser
):
    result = await db.execute(
        select(Installment).where(
            Installment.id == installment_id,
            Installment.sale_id == sale_id,
        )
    )
    inst = result.scalar_one_or_none()
    if not inst:
        raise HTTPException(status_code=404, detail="Taksit bulunamadı")

    allowed_fields = {"due_date", "amount", "status", "paid_amount", "paid_date", "notes"}
    for key, value in body.items():
        if key in allowed_fields:
            if key in ("due_date", "paid_date") and value:
                value = date.fromisoformat(value)
            if key in ("amount", "paid_amount") and value is not None:
                value = Decimal(str(value))
            setattr(inst, key, value)

    await db.flush()
    return {
        "id": str(inst.id), "sale_id": str(inst.sale_id),
        "installment_no": inst.installment_no, "due_date": str(inst.due_date),
        "amount": float(inst.amount), "paid_amount": float(inst.paid_amount),
        "paid_date": str(inst.paid_date) if inst.paid_date else None,
        "status": inst.status, "notes": inst.notes,
    }


@router.get("/{sale_id}/payments", response_model=list[PaymentResponse])
async def get_sale_payments(sale_id: UUID, db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Payment)
        .where(Payment.sale_id == sale_id)
        .order_by(Payment.payment_date.desc())
    )
    return result.scalars().all()


@router.post("/payments", response_model=PaymentResponse, status_code=201)
async def record_payment(body: PaymentCreate, db: DB, current_user: CurrentUser):
    """Ödeme kaydet ve taksit durumunu güncelle."""
    # Satış kontrolü
    sale_result = await db.execute(select(Sale).where(Sale.id == body.sale_id))
    sale = sale_result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=404, detail="Satış bulunamadı")

    payment = Payment(
        **body.model_dump(),
        recorded_by=current_user.id,
    )
    db.add(payment)

    # Taksit güncelleme
    if body.installment_id:
        inst_result = await db.execute(
            select(Installment).where(Installment.id == body.installment_id)
        )
        inst = inst_result.scalar_one_or_none()
        if inst:
            inst.paid_amount += body.amount
            inst.paid_date = body.payment_date
            if inst.paid_amount >= inst.amount:
                inst.status = "paid"
            else:
                inst.status = "partial"

    # Satışın kalan borcunu güncelle
    sale.remaining_debt -= body.amount
    if sale.remaining_debt <= 0:
        sale.remaining_debt = Decimal("0")
        sale.status = "completed"

    await db.flush()
    return payment
