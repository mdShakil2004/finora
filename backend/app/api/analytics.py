from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.services.analytics_service import AnalyticsService
from backend.app.schemas.analytics import CategoryAnalyticsResponse, MonthlyAnalyticsResponse

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/categories", response_model=CategoryAnalyticsResponse, summary="Get Category Spending Analytics")
async def get_category_analytics(db: AsyncSession = Depends(get_db)):
    return await AnalyticsService.get_category_spending(db=db)

@router.get("/monthly", response_model=MonthlyAnalyticsResponse, summary="Get Monthly Spending Trend Analytics")
async def get_monthly_analytics(db: AsyncSession = Depends(get_db)):
    return await AnalyticsService.get_monthly_spending(db=db)
