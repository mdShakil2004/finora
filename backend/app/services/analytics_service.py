from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.app.models.transaction import Transaction
from backend.app.schemas.analytics import CategorySpending, MonthlySpending

class AnalyticsService:
    @staticmethod
    async def get_category_spending(db: AsyncSession) -> List[CategorySpending]:
        # Only successful positive transactions count toward spending analytics
        query = (
            select(
                Transaction.category,
                func.sum(Transaction.amount).label("total_amount"),
                func.count(Transaction.id).label("txn_count")
            )
            .where(
                Transaction.status == "SUCCESS",
                Transaction.amount > 0
            )
            .group_by(Transaction.category)
            .order_by(func.sum(Transaction.amount).desc())
        )
        
        result = await db.execute(query)
        rows = result.all()
        
        return [
            CategorySpending(
                category=row[0],
                amount=round(float(row[1] or 0), 2),
                transaction_count=row[2]
            )
            for row in rows
        ]

    @staticmethod
    async def get_monthly_spending(db: AsyncSession) -> List[MonthlySpending]:
        # Format month YYYY-MM depending on database dialect
        if db.bind and db.bind.dialect.name == "postgresql":
            month_expr = func.to_char(Transaction.timestamp, 'YYYY-MM')
        else:
            month_expr = func.strftime('%Y-%m', Transaction.timestamp)

        query = (
            select(
                month_expr.label("month_str"),
                func.sum(Transaction.amount).label("total_amount")
            )
            .where(
                Transaction.status == "SUCCESS",
                Transaction.amount > 0
            )
            .group_by(month_expr)
            .order_by(month_expr.asc())
        )

        result = await db.execute(query)
        rows = result.all()

        return [
            MonthlySpending(
                month=str(row[0]),
                amount=round(float(row[1] or 0), 2)
            )
            for row in rows if row[0] is not None
        ]
