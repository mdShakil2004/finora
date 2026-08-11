from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.services.transaction_service import TransactionService
from backend.app.schemas.transaction import PaginatedTransactionsResponse, TransactionResponse

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.get("", response_model=PaginatedTransactionsResponse, summary="Get Paginated Transactions")
async def get_transactions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page (max 100)"),
    search: Optional[str] = Query(None, description="Search merchant name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status (SUCCESS, FAILED, PENDING)"),
    min_amount: Optional[float] = Query(None, description="Minimum amount"),
    max_amount: Optional[float] = Query(None, description="Maximum amount"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    sort_by: str = Query("date", description="Field to sort by (date, amount)"),
    sort_order: str = Query("desc", description="Sort direction (asc, desc)"),
    db: AsyncSession = Depends(get_db)
):
    return await TransactionService.get_transactions(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        category=category,
        status=status,
        min_amount=min_amount,
        max_amount=max_amount,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_order=sort_order
    )

@router.get("/{transaction_id}", response_model=TransactionResponse, summary="Get Transaction Details")
async def get_transaction(transaction_id: str, db: AsyncSession = Depends(get_db)):
    return await TransactionService.get_transaction(db=db, transaction_id=transaction_id)
