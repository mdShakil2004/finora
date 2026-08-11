import pytest
from httpx import AsyncClient
from backend.app.main import app

@pytest.mark.asyncio
async def test_get_balance_and_rewards():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        res1 = await ac.get("/api/rewards/balance")
        assert res1.status_code == 200
        assert "coin_balance" in res1.json()

        res2 = await ac.get("/api/rewards")
        assert res2.status_code == 200
        rewards = res2.json()
        assert len(rewards) >= 5

@pytest.mark.asyncio
async def test_nonexistent_reward_redemption():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/rewards/redeem", json={"reward_id": "INVALID-REWARD-ID"})
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_successful_redemption_and_balance_deduction():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Get initial balance
        bal_res1 = await ac.get("/api/rewards/balance")
        initial_balance = bal_res1.json()["coin_balance"]

        # Redeem Amazon voucher (1000 coins)
        redeem_res = await ac.post("/api/rewards/redeem", json={"reward_id": "REW-AMAZON-100"})
        assert redeem_res.status_code == 200
        data = redeem_res.json()
        assert data["success"] is True
        assert data["coins_spent"] == 1000
        assert data["new_balance"] == initial_balance - 1000

        # Verify new balance
        bal_res2 = await ac.get("/api/rewards/balance")
        assert bal_res2.json()["coin_balance"] == initial_balance - 1000
