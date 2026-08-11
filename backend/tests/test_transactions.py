import pytest
from httpx import AsyncClient
from backend.app.main import app

@pytest.mark.asyncio
async def test_get_transactions():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/transactions?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["page"] == 1
    assert len(data["items"]) <= 10

@pytest.mark.asyncio
async def test_transaction_filtering_and_sorting():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/transactions?category=Shopping&status=SUCCESS&sort_by=amount&sort_order=desc")
    assert response.status_code == 200
    data = response.json()
    items = data["items"]
    for item in items:
        assert item["category"] == "Shopping"
        assert item["status"] == "SUCCESS"
    if len(items) > 1:
        assert items[0]["amount"] >= items[1]["amount"]

@pytest.mark.asyncio
async def test_transaction_detail():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        res1 = await ac.get("/api/transactions?page=1&page_size=1")
        assert res1.status_code == 200
        items = res1.json()["items"]
        if items:
            txn_id = items[0]["id"]
            res2 = await ac.get(f"/api/transactions/{txn_id}")
            assert res2.status_code == 200
            assert res2.json()["id"] == txn_id

@pytest.mark.asyncio
async def test_nonexistent_transaction():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/transactions/TXN-NONEXISTENT-999")
    assert response.status_code == 404
