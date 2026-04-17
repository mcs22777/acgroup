"""Dashboard endpoint'leri — özet veriler."""

from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter
from sqlalchemy import select, func, and_

from app.core.dependencies import DB, CurrentUser
from app.models.unit import Unit
from app.models.project import Project
from app.models.customer import Customer
from app.models.opportunity import Opportunity
from app.models.installment import Installment
from app.models.sale import Sale
from app.models.expense import Expense
from app.models.supplier import Supplier
from app.schemas.dashboard import (
    DashboardData, StockSummary, ProjectStockSummary,
    FinancialSummary, CRMSummary, OverdueItem, UpcomingExpense,
)

router = APIRouter()


@router.get("/summary", response_model=DashboardData)
async def get_dashboard(db: DB, current_user: CurrentUser):
    today = date.today()
    month_start = today.replace(day=1)
    month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    week_ago = today - timedelta(days=7)

    # ── Stok Özeti ──
    stock_result = await db.execute(
        select(Unit.status, func.count(Unit.id)).group_by(Unit.status)
    )
    stock_counts = dict(stock_result.all())
    stock = StockSummary(
        total_units=sum(stock_counts.values()),
        available=stock_counts.get("available", 0),
        reserved=stock_counts.get("reserved", 0),
        negotiation=stock_counts.get("negotiation", 0),
        sold=stock_counts.get("sold", 0),
    )

    # ── Proje Bazlı Stok ──
    project_stock_q = await db.execute(
        select(
            Project.id, Project.name, Project.code,
            Unit.status, func.count(Unit.id),
        )
        .join(Unit, Unit.project_id == Project.id)
        .group_by(Project.id, Project.name, Project.code, Unit.status)
    )
    project_map = {}
    for pid, pname, pcode, ustatus, cnt in project_stock_q.all():
        if pid not in project_map:
            project_map[pid] = {
                "project_id": pid, "project_name": pname, "project_code": pcode,
                "total_units": 0, "available": 0, "reserved": 0,
                "negotiation": 0, "sold": 0,
            }
        project_map[pid][ustatus] = cnt
        project_map[pid]["total_units"] += cnt
    project_stocks = [ProjectStockSummary(**v) for v in project_map.values()]

    # ── Finansal Özet ──
    # Bu ay beklenen tahsilat
    expected_q = await db.execute(
        select(func.coalesce(func.sum(Installment.amount - Installment.paid_amount), 0))
        .where(
            Installment.due_date.between(month_start, month_end),
            Installment.status.in_(["pending", "partial"]),
        )
    )
    expected_this_month = expected_q.scalar() or Decimal("0")

    # Bu ay tahsil edilen
    from app.models.payment import Payment
    collected_q = await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.payment_date.between(month_start, month_end))
    )
    collected_this_month = collected_q.scalar() or Decimal("0")

    # Geciken toplam
    overdue_q = await db.execute(
        select(func.coalesce(func.sum(Installment.amount - Installment.paid_amount), 0))
        .where(Installment.status == "overdue")
    )
    overdue_total = overdue_q.scalar() or Decimal("0")

    # Toplam alacak
    receivable_q = await db.execute(
        select(func.coalesce(func.sum(Sale.remaining_debt), 0))
        .where(Sale.status == "active")
    )
    total_receivable = receivable_q.scalar() or Decimal("0")

    # Bu ay firma giderleri
    exp_q = await db.execute(
        select(func.coalesce(func.sum(Expense.amount - Expense.paid_amount), 0))
        .where(
            Expense.due_date.between(month_start, month_end),
            Expense.status.in_(["pending", "partial"]),
        )
    )
    expenses_this_month = exp_q.scalar() or Decimal("0")

    financial = FinancialSummary(
        expected_this_month=expected_this_month,
        collected_this_month=collected_this_month,
        overdue_total=overdue_total,
        total_receivable=total_receivable,
        expenses_this_month=expenses_this_month,
    )

    # ── CRM Özeti ──
    total_customers_q = await db.execute(select(func.count(Customer.id)))
    total_customers = total_customers_q.scalar() or 0

    open_opps_q = await db.execute(
        select(func.count(Opportunity.id))
        .where(Opportunity.status.in_(["new", "contacted", "proposal_sent", "negotiation"]))
    )
    open_opportunities = open_opps_q.scalar() or 0

    new_week_q = await db.execute(
        select(func.count(Customer.id))
        .where(Customer.created_at >= week_ago)
    )
    new_this_week = new_week_q.scalar() or 0

    won_month_q = await db.execute(
        select(func.count(Opportunity.id))
        .where(Opportunity.status == "won", Opportunity.updated_at >= month_start)
    )
    won_this_month = won_month_q.scalar() or 0

    crm = CRMSummary(
        total_customers=total_customers,
        open_opportunities=open_opportunities,
        new_this_week=new_this_week,
        won_this_month=won_this_month,
    )

    # ── Geciken Ödemeler Listesi ──
    overdue_list_q = await db.execute(
        select(Installment, Sale, Customer, Unit)
        .join(Sale, Installment.sale_id == Sale.id)
        .join(Customer, Sale.customer_id == Customer.id)
        .join(Unit, Sale.unit_id == Unit.id)
        .where(Installment.status == "overdue")
        .order_by(Installment.due_date)
        .limit(10)
    )
    overdue_payments = []
    for inst, sale, cust, unit in overdue_list_q.all():
        overdue_payments.append(OverdueItem(
            sale_id=sale.id,
            customer_name=f"{cust.first_name} {cust.last_name}",
            unit_info=f"{unit.unit_number} ({unit.room_type})",
            installment_no=inst.installment_no,
            due_date=str(inst.due_date),
            amount=inst.amount,
            paid_amount=inst.paid_amount,
            overdue_amount=inst.amount - inst.paid_amount,
        ))

    # ── Yaklaşan Firma Giderleri ──
    upcoming_exp_q = await db.execute(
        select(Expense, Supplier)
        .outerjoin(Supplier, Expense.supplier_id == Supplier.id)
        .where(
            Expense.due_date.between(today, today + timedelta(days=30)),
            Expense.status.in_(["pending", "partial"]),
        )
        .order_by(Expense.due_date)
        .limit(10)
    )
    upcoming_expenses = []
    for exp, sup in upcoming_exp_q.all():
        upcoming_expenses.append(UpcomingExpense(
            expense_id=exp.id,
            supplier_name=sup.name if sup else None,
            description=exp.description,
            amount=exp.amount - exp.paid_amount,
            due_date=str(exp.due_date),
            status=exp.status,
        ))

    return DashboardData(
        stock=stock,
        project_stocks=project_stocks,
        financial=financial,
        crm=crm,
        overdue_payments=overdue_payments,
        upcoming_expenses=upcoming_expenses,
    )
