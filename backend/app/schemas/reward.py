from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RewardResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    coin_cost: int
    reward_type: str
    active: bool

    class Config:
        from_attributes = True

class RedeemRequest(BaseModel):
    reward_id: str
    
class RedemptionResponse(BaseModel):
    success: bool
    redemption_id: str
    reward: RewardResponse
    coins_spent: int
    new_balance: int
    redeemed_at: datetime
