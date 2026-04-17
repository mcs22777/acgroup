"""initial_tables

Revision ID: 6ceb3538b1af
Revises:
Create Date: 2026-04-11 19:49:27.042135

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '6ceb3538b1af'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ──
    op.create_table('users',
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('role', sa.String(50), nullable=False, server_default='viewer'),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default=sa.text('true')),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # ── projects ──
    op.create_table('projects',
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('code', sa.String(50), nullable=False),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('district', sa.String(100), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('total_units', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('status', sa.String(50), nullable=True, server_default='active'),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('expected_end', sa.Date(), nullable=True),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_projects_code'), 'projects', ['code'], unique=True)

    # ── blocks ──
    op.create_table('blocks',
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('total_floors', sa.Integer(), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── units ──
    op.create_table('units',
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('block_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('floor_number', sa.Integer(), nullable=False),
        sa.Column('unit_number', sa.String(20), nullable=False),
        sa.Column('room_type', sa.String(50), nullable=False),
        sa.Column('gross_area_m2', sa.Numeric(10, 2), nullable=True),
        sa.Column('net_area_m2', sa.Numeric(10, 2), nullable=True),
        sa.Column('list_price', sa.Numeric(15, 2), nullable=False),
        sa.Column('status', sa.String(50), nullable=True, server_default='available'),
        sa.Column('has_balcony', sa.Boolean(), nullable=True, server_default=sa.text('false')),
        sa.Column('has_parking', sa.Boolean(), nullable=True, server_default=sa.text('false')),
        sa.Column('direction', sa.String(50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['block_id'], ['blocks.id']),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('project_id', 'block_id', 'floor_number', 'unit_number', name='uq_unit_identity'),
    )
    op.create_index(op.f('ix_units_project_id'), 'units', ['project_id'])
    op.create_index(op.f('ix_units_status'), 'units', ['status'])

    # ── customers ──
    op.create_table('customers',
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(20), nullable=False),
        sa.Column('phone_secondary', sa.String(20), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('tc_kimlik_no', sa.String(11), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('source', sa.String(50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_customers_phone'), 'customers', ['phone'])

    # ── suppliers ──
    op.create_table('suppliers',
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('contact_person', sa.String(255), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('tax_number', sa.String(20), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── opportunities ──
    op.create_table('opportunities',
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('unit_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('offered_price', sa.Numeric(15, 2), nullable=True),
        sa.Column('status', sa.String(50), nullable=True, server_default='new'),
        sa.Column('priority', sa.String(20), nullable=True, server_default='medium'),
        sa.Column('expected_close', sa.Date(), nullable=True),
        sa.Column('loss_reason', sa.Text(), nullable=True),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id']),
        sa.ForeignKeyConstraint(['unit_id'], ['units.id']),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_opportunities_customer_id'), 'opportunities', ['customer_id'])
    op.create_index(op.f('ix_opportunities_status'), 'opportunities', ['status'])

    # ── activities ──
    op.create_table('activities',
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('opportunity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('activity_type', sa.String(50), nullable=False),
        sa.Column('subject', sa.String(255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('activity_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('next_action', sa.Text(), nullable=True),
        sa.Column('next_action_date', sa.Date(), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
        sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_activities_customer_id'), 'activities', ['customer_id'])

    # ── sales ──
    op.create_table('sales',
        sa.Column('unit_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('opportunity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('sale_date', sa.Date(), nullable=False),
        sa.Column('sale_price', sa.Numeric(15, 2), nullable=False),
        sa.Column('down_payment', sa.Numeric(15, 2), nullable=True, server_default='0'),
        sa.Column('remaining_debt', sa.Numeric(15, 2), nullable=False),
        sa.Column('installment_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('payment_start_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(50), nullable=True, server_default='active'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id']),
        sa.ForeignKeyConstraint(['unit_id'], ['units.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── installments ──
    op.create_table('installments',
        sa.Column('sale_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('installment_no', sa.Integer(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('paid_amount', sa.Numeric(15, 2), nullable=True, server_default='0'),
        sa.Column('paid_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(50), nullable=True, server_default='pending'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['sale_id'], ['sales.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_installments_sale_id'), 'installments', ['sale_id'])
    op.create_index(op.f('ix_installments_due_date'), 'installments', ['due_date'])
    op.create_index(op.f('ix_installments_status'), 'installments', ['status'])

    # ── payments ──
    op.create_table('payments',
        sa.Column('sale_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('installment_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('payment_date', sa.Date(), nullable=False),
        sa.Column('payment_method', sa.String(50), nullable=True),
        sa.Column('reference_no', sa.String(100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('recorded_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['installment_id'], ['installments.id']),
        sa.ForeignKeyConstraint(['recorded_by'], ['users.id']),
        sa.ForeignKeyConstraint(['sale_id'], ['sales.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── contract_templates ──
    op.create_table('contract_templates',
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('content_html', sa.Text(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default=sa.text('true')),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── contracts ──
    op.create_table('contracts',
        sa.Column('sale_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('template_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('contract_number', sa.String(50), nullable=False),
        sa.Column('content_html', sa.Text(), nullable=True),
        sa.Column('status', sa.String(50), nullable=True, server_default='draft'),
        sa.Column('signed_date', sa.Date(), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['sale_id'], ['sales.id']),
        sa.ForeignKeyConstraint(['template_id'], ['contract_templates.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('contract_number'),
    )

    # ── documents ──
    op.create_table('documents',
        sa.Column('related_type', sa.String(50), nullable=False),
        sa.Column('related_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=True),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('version', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('uploaded_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_documents_related_type'), 'documents', ['related_type'])

    # ── expenses ──
    op.create_table('expenses',
        sa.Column('supplier_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('description', sa.String(500), nullable=False),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('paid_amount', sa.Numeric(15, 2), nullable=True, server_default='0'),
        sa.Column('paid_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(50), nullable=True, server_default='pending'),
        sa.Column('payment_method', sa.String(50), nullable=True),
        sa.Column('invoice_no', sa.String(100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id']),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_expenses_supplier_id'), 'expenses', ['supplier_id'])
    op.create_index(op.f('ix_expenses_project_id'), 'expenses', ['project_id'])
    op.create_index(op.f('ix_expenses_due_date'), 'expenses', ['due_date'])
    op.create_index(op.f('ix_expenses_status'), 'expenses', ['status'])

    # ── audit_logs ──
    op.create_table('audit_logs',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('old_values', postgresql.JSONB(), nullable=True),
        sa.Column('new_values', postgresql.JSONB(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_audit_logs_entity_type'), 'audit_logs', ['entity_type'])


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('expenses')
    op.drop_table('documents')
    op.drop_table('contracts')
    op.drop_table('contract_templates')
    op.drop_table('payments')
    op.drop_table('installments')
    op.drop_table('sales')
    op.drop_table('activities')
    op.drop_table('opportunities')
    op.drop_table('suppliers')
    op.drop_table('customers')
    op.drop_table('units')
    op.drop_table('blocks')
    op.drop_table('projects')
    op.drop_table('users')
