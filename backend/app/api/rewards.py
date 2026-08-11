from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.services.reward_service import RewardService
from backend.app.schemas.reward import RewardResponse, RedeemRequest, RedemptionResponse
from backend.app.schemas.user import CoinBalanceResponse

router = APIRouter(prefix="/api/rewards", tags=["Rewards"])

@router.get("/balance", response_model=CoinBalanceResponse, summary="Get User Reward Coin Balance")
async def get_balance(db: AsyncSession = Depends(get_db)):
    return await RewardService.get_user_balance(db=db, user_id=settings.DEMO_USER_ID)

@router.get("", response_model=List[RewardResponse], summary="Get Available Rewards Catalogue")
async def get_rewards(db: AsyncSession = Depends(get_db)):
    return await RewardService.get_rewards(db=db)

@router.post("/redeem", response_model=RedemptionResponse, summary="Redeem Reward Voucher")
async def redeem_reward(payload: RedeemRequest, db: AsyncSession = Depends(get_db)):
    return await RewardService.redeem_reward(
        db=db,
        user_id=settings.DEMO_USER_ID,
        reward_id=payload.reward_id
    )
