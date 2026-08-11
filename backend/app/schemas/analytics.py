from pydantic import BaseModel
from typing import List

class CategorySpending(BaseModel):
    category: str
    amount: float
    transaction_count: int

class MonthlySpending(BaseModel):
    month: str
    amount: float

CategoryAnalyticsResponse = List[CategorySpending]
MonthlyAnalyticsResponse = List[MonthlySpending]
