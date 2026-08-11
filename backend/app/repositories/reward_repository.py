from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.reward import Reward

class RewardRepository:
    @staticmethod
    async def get_all_active(db: AsyncSession) -> List[Reward]:
        query = select(Reward).where(Reward.active == True).order_by(Reward.coin_cost.asc())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(db: AsyncSession, reward_id: str) -> Optional[Reward]:
        query = select(Reward).where(Reward.id == reward_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()
