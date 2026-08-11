import math
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.repositories.transaction_repository import TransactionRepository
from backend.app.schemas.transaction import PaginatedTransactionsResponse, TransactionResponse
from fastapi import HTTPException

class TransactionService:
    @staticmethod
    async def get_transactions(
        db: AsyncSession,
        page: int = 1,
        page_size: int = 25,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        sort_by: str = "date",
        sort_order: str = "desc"
    ) -> PaginatedTransactionsResponse:
        
        # Enforce page_size upper bound
        page_size = min(max(1, page_size), 100)
        page = max(1, page)
        
        # Validate sort_by
        if sort_by not in ["date", "timestamp", "amount"]:
            sort_by = "date"
            
        if sort_order.lower() not in ["asc", "desc"]:
            sort_order = "desc"

        items, total = await TransactionRepository.get_paginated(
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

        total_pages = math.ceil(total / page_size) if page_size > 0 else 0

        # Convert ORM objects to schemas
        response_items = [
            TransactionResponse(
                id=item.id,
                timestamp=item.timestamp,
                merchant=item.merchant,
                category=item.category,
                amount=float(item.amount),
                currency=item.currency,
                status=item.status,
                payment_method=item.payment_method
            )
            for item in items
        ]

        return PaginatedTransactionsResponse(
            items=response_items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages
        )

    @staticmethod
    async def get_transaction(db: AsyncSession, transaction_id: str) -> TransactionResponse:
        txn = await TransactionRepository.get_by_id(db, transaction_id)
        if not txn:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return TransactionResponse(
            id=txn.id,
            timestamp=txn.timestamp,
            merchant=txn.merchant,
            category=txn.category,
            amount=float(txn.amount),
            currency=txn.currency,
            status=txn.status,
            payment_method=txn.payment_method
        )
