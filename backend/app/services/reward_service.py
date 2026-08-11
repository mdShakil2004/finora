import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from backend.app.repositories.reward_repository import RewardRepository
from backend.app.repositories.user_repository import UserRepository
from backend.app.repositories.redemption_repository import RedemptionRepository
from backend.app.schemas.reward import RewardResponse, RedemptionResponse
from backend.app.schemas.user import CoinBalanceResponse

class RewardService:
    @staticmethod
    async def get_user_balance(db: AsyncSession, user_id: str) -> CoinBalanceResponse:
        user = await UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return CoinBalanceResponse(user_id=user.id, coin_balance=user.coin_balance)

    @staticmethod
    async def get_rewards(db: AsyncSession) -> List[RewardResponse]:
        rewards = await RewardRepository.get_all_active(db)
        return [
            RewardResponse(
                id=r.id,
                name=r.name,
                description=r.description,
                coin_cost=r.coin_cost,
                reward_type=r.reward_type,
                active=r.active
            )
            for r in rewards
        ]

    @staticmethod
    async def redeem_reward(db: AsyncSession, user_id: str, reward_id: str) -> RedemptionResponse:
        # Atomic redemption process
        try:
            # Step 1: Check reward existence
            reward = await RewardRepository.get_by_id(db, reward_id)
            if not reward:
                raise HTTPException(status_code=404, detail="Reward not found")
            
            if not reward.active:
                raise HTTPException(status_code=409, detail="Reward is inactive")

            # Step 2: Lock user row for update to prevent concurrent race conditions
            user = await UserRepository.get_by_id_for_update(db, user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Step 3: Validate coin balance
            if user.coin_balance < reward.coin_cost:
                raise HTTPException(
                    status_code=409,
                    detail=f"Insufficient coin balance. Required: {reward.coin_cost}, Available: {user.coin_balance}"
                )

            # Step 4: Perform atomic deduction
            user.coin_balance -= reward.coin_cost
            
            # Step 5: Record redemption in ledger
            redemption_id = f"RED-{uuid.uuid4().hex[:8].upper()}"
            now = datetime.now(timezone.utc)
            
            await RedemptionRepository.create(
                db=db,
                redemption_id=redemption_id,
                user_id=user_id,
                reward_id=reward_id,
                coins_spent=reward.coin_cost,
                redeemed_at=now
            )

            # Step 6: Commit transaction
            await db.commit()
            await db.refresh(user)

            return RedemptionResponse(
                success=True,
                redemption_id=redemption_id,
                reward=RewardResponse(
                    id=reward.id,
                    name=reward.name,
                    description=reward.description,
                    coin_cost=reward.coin_cost,
                    reward_type=reward.reward_type,
                    active=reward.active
                ),
                coins_spent=reward.coin_cost,
                new_balance=user.coin_balance,
                redeemed_at=now
            )

        except HTTPException:
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to process redemption: {str(e)}")
