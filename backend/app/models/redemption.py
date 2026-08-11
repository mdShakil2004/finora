from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func
from backend.app.core.database import Base

class RewardRedemption(Base):
    __tablename__ = "reward_redemptions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    reward_id = Column(String, ForeignKey("rewards.id"), nullable=False, index=True)
    coins_spent = Column(Integer, nullable=False)
    redeemed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
