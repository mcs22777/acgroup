"""add expense_installments table

Revision ID: a1b2c3d4e5f6
Revises: 6ceb3538b1af
Create Date: 2026-04-20 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '6ceb3538b1af'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('expense_installments',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('expense_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('installment_no', sa.Integer(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('paid_amount', sa.Numeric(precision=15, scale=2), server_default='0', nullable=True),
        sa.Column('paid_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='pending', nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['expense_id'], ['expenses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_expense_installments_expense_id', 'expense_installments', ['expense_id'])


def downgrade() -> None:
    op.drop_index('ix_expense_installments_expense_id', table_name='expense_installments')
    op.drop_table('expense_installments')
