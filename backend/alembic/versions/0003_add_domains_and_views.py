"""add domains and idea views

Revision ID: 0003_add_domains_and_views
Revises: 0002_add_metrics
Create Date: 2025-07-28 08:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0003_add_domains_and_views'
down_revision = '0002_add_metrics'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### Add new fields to existing tables ###
    
    # Add fields to users table
    op.add_column('users', sa.Column('selected_domains', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('users', sa.Column('onboarding_completed', sa.Boolean(), nullable=True, server_default='false'))
    
    # Add fields to ideas table  
    op.add_column('ideas', sa.Column('domain', sa.String(), nullable=True))
    op.add_column('ideas', sa.Column('generated_for_domains', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    
    # Set default domain for existing ideas (from first tag)
    op.execute("UPDATE ideas SET domain = COALESCE(tags->>0, 'unknown') WHERE domain IS NULL")
    
    # Make domain field non-nullable after setting defaults
    op.alter_column('ideas', 'domain', nullable=False)
    
    # Create new idea_views table
    op.create_table('idea_views',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('idea_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('viewed_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['idea_id'], ['ideas.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'idea_id', name='unique_view_user_idea')
    )


def downgrade() -> None:
    # ### Remove new additions ###
    op.drop_table('idea_views')
    op.drop_column('ideas', 'generated_for_domains')
    op.drop_column('ideas', 'domain')
    op.drop_column('users', 'onboarding_completed')
    op.drop_column('users', 'selected_domains') 