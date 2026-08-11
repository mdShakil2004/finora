from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.user import User

class UserRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        query = select(User).where(User.id == user_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_id_for_update(db: AsyncSession, user_id: str) -> Optional[User]:
        # Lock user row for update during atomic redemption transaction
        query = select(User).where(User.id == user_id).with_for_update()
        result = await db.execute(query)
        return result.scalar_one_or_none()
