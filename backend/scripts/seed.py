import os
import json
import math
import asyncio
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from backend.app.core.config import settings
from backend.app.core.database import Base
from backend.app.models import Transaction, User, Reward, RewardRedemption

def parse_timestamp(raw_val) -> datetime:
    if raw_val is None:
        raise ValueError("Timestamp is None")

    # If Unix timestamp in milliseconds (e.g., 1773586930000 or "1773586930000")
    if isinstance(raw_val, (int, float)) or (isinstance(raw_val, str) and raw_val.isdigit()):
        ts_num = float(raw_val)
        if ts_num > 10000000000: # millis
            ts_num /= 1000.0
        return datetime.fromtimestamp(ts_num, tz=timezone.utc)

    val_str = str(raw_val).strip()

    # Slash formatted date "YYYY/MM/DD HH:MM:SS" or "YYYY/MM/DD"
    if "/" in val_str:
        val_str = val_str.replace("/", "-")

    # Date-only "YYYY-MM-DD"
    if len(val_str) == 10 and val_str.count("-") == 2:
        val_str += "T00:00:00Z"

    # ISO format replacement
    if val_str.endswith("Z"):
        val_str = val_str[:-1] + "+00:00"

    try:
        dt = datetime.fromisoformat(val_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception as e:
        raise ValueError(f"Unable to parse datetime from '{raw_val}': {str(e)}")

def normalize_status(raw_status) -> str:
    if not raw_status:
        return "PENDING"
    st = str(raw_status).strip().upper()
    if "SUCC" in st:
        return "SUCCESS"
    if "FAIL" in st:
        return "FAILED"
    if "PEND" in st:
        return "PENDING"
    return "SUCCESS" if st == "SUCCESS" else "PENDING"

def normalize_category(raw_cat) -> str:
    if not raw_cat or not str(raw_cat).strip():
        return "Uncategorized"
    cat = str(raw_cat).strip()
    if cat.lower() in ["null", "none", "undefined", "n/a"]:
        return "Uncategorized"
    return cat

def normalize_amount(raw_amt) -> Decimal:
    try:
        val = Decimal(str(raw_amt).strip())
        return round(val, 2)
    except Exception as e:
        raise ValueError(f"Invalid amount '{raw_amt}': {str(e)}")

async def run_seed():
    print("=" * 60)
    print("STARTING FINORA DATABASE SEED PIPELINE")
    print("=" * 60)

    # Connect to PostgreSQL
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        print("Ensuring database tables exist...")
        await conn.run_sync(Base.metadata.create_all)

    AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    json_path = os.path.abspath("transactions.json")
    if not os.path.exists(json_path):
        json_path = os.path.abspath("../transactions.json")

    if not os.path.exists(json_path):
        print(f"ERROR: Source file transactions.json not found at {json_path}")
        return

    print(f"Reading dataset from {json_path}...")
    with open(json_path, "r") as f:
        raw_data = json.load(f)

    read_count = len(raw_data)
    inserted_count = 0
    skipped_count = 0
    normalization_issues = 0
    duplicate_count = 0

    seen_ids = set()
    cleaned_txns = []
    total_earned_coins = 0

    for idx, record in enumerate(raw_data):
        tx_id = record.get("id")
        if not tx_id:
            skipped_count += 1
            normalization_issues += 1
            continue

        if tx_id in seen_ids:
            duplicate_count += 1
            skipped_count += 1
            continue
        seen_ids.add(tx_id)

        try:
            timestamp = parse_timestamp(record.get("timestamp"))
            status = normalize_status(record.get("status"))
            category = normalize_category(record.get("category"))
            amount = normalize_amount(record.get("amount"))
            merchant = str(record.get("merchant", "Unknown Merchant")).strip() or "Unknown Merchant"
            payment_method = str(record.get("payment_method", "UPI")).strip() or "UPI"
            currency = str(record.get("currency", "INR")).strip().upper() or "INR"

            # Check normalization tracking
            if category == "Uncategorized" or status != str(record.get("status")) or isinstance(record.get("timestamp"), (int, str)):
                normalization_issues += 1

            # Calculate reward coins: 1 coin per ₹100 spent on successful positive payments (max 500)
            if status == "SUCCESS" and amount > 0:
                coins = min(math.floor(float(amount) / 100.0), settings.MAX_REWARD_COINS_PER_TRANSACTION)
                total_earned_coins += coins

            cleaned_txns.append(Transaction(
                id=tx_id,
                timestamp=timestamp,
                merchant=merchant,
                category=category,
                amount=amount,
                currency=currency,
                status=status,
                payment_method=payment_method
            ))

        except Exception as e:
            skipped_count += 1
            normalization_issues += 1
            if idx < 10:
                print(f"Normalization error on record {idx}: {e}")

    async with AsyncSessionLocal() as db:
        # Clear existing transactions & seed data for clean rerun idempotency
        await db.execute(Base.metadata.tables["reward_redemptions"].delete())
        await db.execute(Base.metadata.tables["transactions"].delete())
        await db.execute(Base.metadata.tables["rewards"].delete())
        await db.execute(Base.metadata.tables["users"].delete())
        await db.commit()

        # Batch insert transactions
        print(f"Batch inserting {len(cleaned_txns)} transactions into PostgreSQL...")
        batch_size = 1000
        for i in range(0, len(cleaned_txns), batch_size):
            batch = cleaned_txns[i : i + batch_size]
            db.add_all(batch)
            await db.commit()
            inserted_count += len(batch)

        # Seed Rewards Catalogue
        rewards_catalogue = [
            Reward(
                id="REW-AMAZON-100",
                name="Amazon ₹100 Voucher",
                description="Instant ₹100 shopping voucher for Amazon.in",
                coin_cost=1000,
                reward_type="voucher",
                active=True
            ),
            Reward(
                id="REW-SWIGGY-100",
                name="Swiggy ₹100 Voucher",
                description="Delicious ₹100 voucher for food orders on Swiggy",
                coin_cost=1000,
                reward_type="voucher",
                active=True
            ),
            Reward(
                id="REW-FLIPKART-250",
                name="Flipkart ₹250 Voucher",
                description="₹250 voucher for all electronics & fashion on Flipkart",
                coin_cost=2200,
                reward_type="voucher",
                active=True
            ),
            Reward(
                id="REW-CASHBACK-500",
                name="Cashback ₹500",
                description="Direct ₹500 credit back to your primary bank account",
                coin_cost=4500,
                reward_type="cashback",
                active=True
            ),
            Reward(
                id="REW-TRAVEL-1000",
                name="Travel Voucher ₹1000",
                description="₹1000 flight & hotel discount voucher on MakeMyTrip",
                coin_cost=8500,
                reward_type="travel",
                active=True
            ),
        ]
        db.add_all(rewards_catalogue)

        # Seed Demo User
        demo_user = User(
            id=settings.DEMO_USER_ID,
            name="Demo User",
            coin_balance=total_earned_coins
        )
        db.add(demo_user)
        await db.commit()

    await engine.dispose()

    print("=" * 60)
    print("FINORA SEED COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print(f"Total Records Read:      {read_count}")
    print(f"Total Records Inserted:  {inserted_count}")
    print(f"Total Records Skipped:   {skipped_count}")
    print(f"Duplicate Records:       {duplicate_count}")
    print(f"Normalization Adjustments: {normalization_issues}")
    print(f"Demo User Initial Coins: {total_earned_coins:,} coins")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_seed())
