from sqlalchemy import Column, String, Integer, Boolean, DateTime, func
from backend.app.core.database import Base

class Reward(Base):
    __tablename__ = "rewards"

    id = Column(String, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(String, nullable=True)
    coin_cost = Column(Integer, nullable=False)
    reward_type = Column(String(50), nullable=False)
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
