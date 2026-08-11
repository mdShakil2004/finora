from typing import Tuple, List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from backend.app.models.transaction import Transaction

class TransactionRepository:
    @staticmethod
    async def get_paginated(
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
    ) -> Tuple[List[Transaction], int]:
        
        query = select(Transaction)
        count_query = select(func.count(Transaction.id))
        
        conditions = []
        
        # Search merchant name
        if search and search.strip():
            search_term = f"%{search.strip().lower()}%"
            conditions.append(func.lower(Transaction.merchant).like(search_term))
            
        # Category filter
        if category and category.strip():
            conditions.append(Transaction.category == category.strip())
            
        # Status filter
        if status and status.strip():
            conditions.append(Transaction.status == status.strip().upper())
            
        # Amount range
        if min_amount is not None:
            conditions.append(Transaction.amount >= min_amount)
        if max_amount is not None:
            conditions.append(Transaction.amount <= max_amount)
            
        # Date range
        if start_date and start_date.strip():
            try:
                dt_start = datetime.fromisoformat(start_date.strip().replace("Z", "+00:00"))
                conditions.append(Transaction.timestamp >= dt_start)
            except ValueError:
                pass
                
        if end_date and end_date.strip():
            try:
                # If date-only string like YYYY-MM-DD, set to end of day
                ed_str = end_date.strip()
                if len(ed_str) == 10:
                    ed_str += "T23:59:59Z"
                dt_end = datetime.fromisoformat(ed_str.replace("Z", "+00:00"))
                conditions.append(Transaction.timestamp <= dt_end)
            except ValueError:
                pass

        if conditions:
            query = query.where(*conditions)
            count_query = count_query.where(*conditions)
            
        # Total count
        total_res = await db.execute(count_query)
        total = total_res.scalar_one() or 0
        
        # Sorting
        if sort_by in ["amount"]:
            sort_column = Transaction.amount
        else: # "date" or "timestamp"
            sort_column = Transaction.timestamp
            
        if sort_order.lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
            
        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)
        
        result = await db.execute(query)
        items = list(result.scalars().all())
        
        return items, total

    @staticmethod
    async def get_by_id(db: AsyncSession, transaction_id: str) -> Optional[Transaction]:
        query = select(Transaction).where(Transaction.id == transaction_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()
