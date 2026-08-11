from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.redemption import RewardRedemption

class RedemptionRepository:
    @staticmethod
    async def create(
        db: AsyncSession,
        redemption_id: str,
        user_id: str,
        reward_id: str,
        coins_spent: int,
        redeemed_at: datetime
    ) -> RewardRedemption:
        redemption = RewardRedemption(
            id=redemption_id,
            user_id=user_id,
            reward_id=reward_id,
            coins_spent=coins_spent,
            redeemed_at=redeemed_at
        )
        db.add(redemption)
        return redemption
