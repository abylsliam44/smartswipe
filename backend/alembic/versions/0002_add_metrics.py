"""add metrics columns to ml_model_meta

Revision ID: 0002_add_metrics
Revises: 0001_initial
Create Date: 2025-07-23
"""
from alembic import op
import sqlalchemy as sa

revision = '0002_add_metrics'
down_revision = '0001_initial'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('ml_model_meta', sa.Column('precision', sa.String()))
    op.add_column('ml_model_meta', sa.Column('recall', sa.String()))
    op.add_column('ml_model_meta', sa.Column('f1', sa.String()))
    op.add_column('ml_model_meta', sa.Column('roc_auc', sa.String()))


def downgrade() -> None:
    op.drop_column('ml_model_meta', 'roc_auc')
    op.drop_column('ml_model_meta', 'f1')
    op.drop_column('ml_model_meta', 'recall')
    op.drop_column('ml_model_meta', 'precision') 