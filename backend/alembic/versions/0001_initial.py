"""Initial schema

Revision ID: 0001_initial
Revises: 
Create Date: 2025-07-23
"""
from alembic import op
import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as pg

# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', pg.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        'ideas',
        sa.Column('id', pg.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('title', sa.String(), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('tags', pg.JSON(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        'swipes',
        sa.Column('id', pg.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', pg.UUID(as_uuid=True), nullable=False),
        sa.Column('idea_id', pg.UUID(as_uuid=True), nullable=False),
        sa.Column('swipe', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['idea_id'], ['ideas.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', 'idea_id', name='unique_swipe_user_idea'),
    )

    op.create_table(
        'ml_model_meta',
        sa.Column('id', sa.String(), primary_key=True, nullable=False),
        sa.Column('trained_at', sa.TIMESTAMP(timezone=True)),
        sa.Column('accuracy', sa.String()),
        sa.Column('model_path', sa.String()),
    )


def downgrade() -> None:
    op.drop_table('ml_model_meta')
    op.drop_table('swipes')
    op.drop_table('ideas')
    op.drop_table('users') 