from pydantic import BaseModel

class UserResponse(BaseModel):
    id: str
    name: str
    coin_balance: int

    class Config:
        from_attributes = True

class CoinBalanceResponse(BaseModel):
    user_id: str
    coin_balance: int
