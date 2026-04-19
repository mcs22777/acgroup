"""SQLAlchemy modelleri — tüm tabloları burada import et."""

from app.models.user import User
from app.models.project import Project, Block
from app.models.unit import Unit
from app.models.customer import Customer
from app.models.opportunity import Opportunity
from app.models.activity import Activity
from app.models.sale import Sale
from app.models.installment import Installment
from app.models.payment import Payment
from app.models.contract import ContractTemplate, Contract
from app.models.document import Document
from app.models.supplier import Supplier
from app.models.expense import Expense
from app.models.expense_installment import ExpenseInstallment
from app.models.audit import AuditLog

__all__ = [
    "User",
    "Project", "Block",
    "Unit",
    "Customer",
    "Opportunity",
    "Activity",
    "Sale",
    "Installment",
    "Payment",
    "ContractTemplate", "Contract",
    "Document",
    "Supplier",
    "Expense",
    "ExpenseInstallment",
    "AuditLog",
]
