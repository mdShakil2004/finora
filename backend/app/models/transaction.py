from sqlalchemy import Column, String, Numeric, DateTime, Index, func
from backend.app.core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    merchant = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    amount = Column(Numeric(14, 2), nullable=False, index=True)
    currency = Column(String(3), nullable=False, default="INR")
    status = Column(String(20), nullable=False, index=True)
    payment_method = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

__table_args__ = (
    Index("idx_txn_timestamp", Transaction.timestamp),
    Index("idx_txn_merchant", Transaction.merchant),
    Index("idx_txn_category", Transaction.category),
    Index("idx_txn_status", Transaction.status),
    Index("idx_txn_amount", Transaction.amount),
)
