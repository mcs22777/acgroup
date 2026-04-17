"""Dashboard ve raporlama şemaları."""

from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel


class StockSummary(BaseModel):
    total_units: int = 0
    available: int = 0
    reserved: int = 0
    negotiation: int = 0
    sold: int = 0


class ProjectStockSummary(BaseModel):
    project_id: UUID
    project_name: str
    project_code: str
    total_units: int
    available: int
    reserved: int
    negotiation: int
    sold: int


class FinancialSummary(BaseModel):
    expected_this_month: Decimal = Decimal("0")
    collected_this_month: Decimal = Decimal("0")
    overdue_total: Decimal = Decimal("0")
    total_receivable: Decimal = Decimal("0")
    expenses_this_month: Decimal = Decimal("0")
    expenses_paid_this_month: Decimal = Decimal("0")


class CRMSummary(BaseModel):
    total_customers: int = 0
    open_opportunities: int = 0
    new_this_week: int = 0
    won_this_month: int = 0
    lost_this_month: int = 0


class OverdueItem(BaseModel):
    sale_id: UUID
    customer_name: str
    unit_info: str
    installment_no: int
    due_date: str
    amount: Decimal
    paid_amount: Decimal
    overdue_amount: Decimal


class UpcomingExpense(BaseModel):
    expense_id: UUID
    supplier_name: str | None
    description: str
    amount: Decimal
    due_date: str
    status: str


class DashboardData(BaseModel):
    stock: StockSummary
    project_stocks: list[ProjectStockSummary]
    financial: FinancialSummary
    crm: CRMSummary
    overdue_payments: list[OverdueItem]
    upcoming_expenses: list[UpcomingExpense]
