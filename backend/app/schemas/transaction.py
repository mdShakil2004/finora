from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

class TransactionResponse(BaseModel):
    id: str
    timestamp: datetime
    merchant: str
    category: str
    amount: float
    currency: str = "INR"
    status: str
    payment_method: str

    class Config:
        orm_mode = True
        from_attributes = True

class PaginatedTransactionsResponse(BaseModel):
    items: List[TransactionResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
