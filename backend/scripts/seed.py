import json
import math
import asyncio
from pathlib import Path
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

    # Unix timestamp in seconds or milliseconds
    if isinstance(raw_val, (int, float)) or (
        isinstance(raw_val, str) and raw_val.isdigit()
    ):
        ts_num = float(raw_val)

        # Convert milliseconds to seconds
        if ts_num > 10_000_000_000:
            ts_num /= 1000.0

        return datetime.fromtimestamp(ts_num, tz=timezone.utc)

    val_str = str(raw_val).strip()

    # Convert YYYY/MM/DD to YYYY-MM-DD
    if "/" in val_str:
        val_str = val_str.replace("/", "-")

    # Date-only format: YYYY-MM-DD
    if len(val_str) == 10 and val_str.count("-") == 2:
        val_str += "T00:00:00Z"

    # Convert trailing Z to ISO timezone
    if val_str.endswith("Z"):
        val_str = val_str[:-1] + "+00:00"

    try:
        dt = datetime.fromisoformat(val_str)

        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)

        return dt

    except Exception as e:
        raise ValueError(
            f"Unable to parse datetime from '{raw_val}': {str(e)}"
        )


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

    return "PENDING"


def normalize_category(raw_cat) -> str:
    if not raw_cat or not str(raw_cat).strip():
        return "Uncategorized"

    cat = str(raw_cat).strip()

    if cat.lower() in [
        "null",
        "none",
        "undefined",
        "n/a",
    ]:
        return "Uncategorized"

    return cat


def normalize_amount(raw_amt) -> Decimal:
    try:
        value = Decimal(str(raw_amt).strip())

        # Keep monetary values at 2 decimal places
        return value.quantize(Decimal("0.01"))

    except Exception as e:
        raise ValueError(
            f"Invalid amount '{raw_amt}': {str(e)}"
        )


async def run_seed():

    print("=" * 60)
    print("STARTING FINORA DATABASE SEED PIPELINE")
    print("=" * 60)

    # ---------------------------------------------------------
    # 1. Resolve repository root
    #
    # Current file:
    #
    # finora/
    #   backend/
    #     scripts/
    #       seed.py   <-- this file
    #
    # parents[0] = scripts
    # parents[1] = backend
    # parents[2] = finora
    # ---------------------------------------------------------

    BASE_DIR = Path(__file__).resolve().parents[2]

    # Production/local dataset:
    #
    # finora/transactions.json
    json_path = BASE_DIR / "transactions.json"

    if not json_path.exists():
        raise FileNotFoundError(
            f"Source file transactions.json not found at: {json_path}"
        )

    print(f"Dataset path: {json_path}")

    # ---------------------------------------------------------
    # 2. Connect to configured database
    #
    # Render:
    #   DATABASE_URL -> Neon PostgreSQL
    #
    # Local:
    #   DATABASE_URL -> local configured database
    # ---------------------------------------------------------

    if not settings.DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL environment variable is not configured."
        )

    print("Connecting to configured database...")

    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
    )

    # ---------------------------------------------------------
    # 3. Ensure database tables exist
    # ---------------------------------------------------------

    async with engine.begin() as conn:
        print("Ensuring database tables exist...")
        await conn.run_sync(Base.metadata.create_all)

    AsyncSessionLocal = sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    # ---------------------------------------------------------
    # 4. Read transactions.json
    # ---------------------------------------------------------

    print("Reading transactions dataset...")

    with json_path.open("r", encoding="utf-8") as file:
        raw_data = json.load(file)

    if not isinstance(raw_data, list):
        raise ValueError(
            "transactions.json must contain a JSON array of transactions."
        )

    read_count = len(raw_data)

    print(f"Total records found: {read_count:,}")

    # ---------------------------------------------------------
    # 5. Normalize and validate transactions
    # ---------------------------------------------------------

    inserted_count = 0
    skipped_count = 0
    normalization_issues = 0
    duplicate_count = 0

    seen_ids = set()
    cleaned_txns = []

    total_earned_coins = 0

    for idx, record in enumerate(raw_data):

        if not isinstance(record, dict):
            skipped_count += 1
            normalization_issues += 1
            continue

        tx_id = record.get("id")

        if not tx_id:
            skipped_count += 1
            normalization_issues += 1
            continue

        tx_id = str(tx_id).strip()

        # Prevent duplicate transaction IDs
        if tx_id in seen_ids:
            duplicate_count += 1
            skipped_count += 1
            continue

        seen_ids.add(tx_id)

        try:
            timestamp = parse_timestamp(
                record.get("timestamp")
            )

            status = normalize_status(
                record.get("status")
            )

            category = normalize_category(
                record.get("category")
            )

            amount = normalize_amount(
                record.get("amount")
            )

            merchant = (
                str(
                    record.get(
                        "merchant",
                        "Unknown Merchant",
                    )
                ).strip()
                or "Unknown Merchant"
            )

            payment_method = (
                str(
                    record.get(
                        "payment_method",
                        "UPI",
                    )
                ).strip()
                or "UPI"
            )

            currency = (
                str(
                    record.get(
                        "currency",
                        "INR",
                    )
                ).strip()
                .upper()
                or "INR"
            )

            # Track normalization changes
            original_status = str(
                record.get("status", "")
            ).strip().upper()

            if (
                category == "Uncategorized"
                or status != original_status
                or isinstance(
                    record.get("timestamp"),
                    (int, str),
                )
            ):
                normalization_issues += 1

            # -------------------------------------------------
            # Reward calculation
            #
            # 1 coin per ₹100 spent
            # Maximum coins per transaction controlled by:
            # MAX_REWARD_COINS_PER_TRANSACTION
            #
            # Only successful positive transactions earn coins.
            # -------------------------------------------------

            if status == "SUCCESS" and amount > 0:

                coins = min(
                    math.floor(
                        float(amount) / 100.0
                    ),
                    settings.MAX_REWARD_COINS_PER_TRANSACTION,
                )

                total_earned_coins += coins

            cleaned_txns.append(
                Transaction(
                    id=tx_id,
                    timestamp=timestamp,
                    merchant=merchant,
                    category=category,
                    amount=amount,
                    currency=currency,
                    status=status,
                    payment_method=payment_method,
                )
            )

        except Exception as e:

            skipped_count += 1
            normalization_issues += 1

            if idx < 10:
                print(
                    f"Normalization error on record "
                    f"{idx}: {e}"
                )

    print("-" * 60)
    print("DATASET PROCESSING SUMMARY")
    print("-" * 60)
    print(f"Records read:              {read_count:,}")
    print(f"Valid records:             {len(cleaned_txns):,}")
    print(f"Skipped records:           {skipped_count:,}")
    print(f"Duplicate records:         {duplicate_count:,}")
    print(
        f"Normalization adjustments: {normalization_issues:,}"
    )
    print(
        f"Calculated reward coins:   {total_earned_coins:,}"
    )
    print("-" * 60)

    # ---------------------------------------------------------
    # 6. Seed database
    # ---------------------------------------------------------

    async with AsyncSessionLocal() as db:

        print("Preparing database for seed...")

        # This seed is designed to initialize/reset the demo
        # dataset. It removes previous demo data before inserting
        # the current dataset.
        #
        # IMPORTANT:
        # Do not execute this automatically on every application
        # startup in production.
        # -----------------------------------------------------

        await db.execute(
            Base.metadata.tables[
                "reward_redemptions"
            ].delete()
        )

        await db.execute(
            Base.metadata.tables[
                "transactions"
            ].delete()
        )

        await db.execute(
            Base.metadata.tables[
                "rewards"
            ].delete()
        )

        await db.execute(
            Base.metadata.tables[
                "users"
            ].delete()
        )

        await db.commit()

        # -----------------------------------------------------
        # 7. Insert transactions in batches
        # -----------------------------------------------------

        print(
            f"Batch inserting "
            f"{len(cleaned_txns):,} transactions..."
        )

        batch_size = 1000

        for i in range(
            0,
            len(cleaned_txns),
            batch_size,
        ):

            batch = cleaned_txns[
                i : i + batch_size
            ]

            db.add_all(batch)

            await db.commit()

            inserted_count += len(batch)

            print(
                f"Inserted "
                f"{inserted_count:,}/"
                f"{len(cleaned_txns):,}"
            )

        # -----------------------------------------------------
        # 8. Seed rewards catalogue
        # -----------------------------------------------------

        print("Seeding rewards catalogue...")

        rewards_catalogue = [

            Reward(
                id="REW-AMAZON-100",
                name="Amazon ₹100 Voucher",
                description=(
                    "Instant ₹100 shopping voucher "
                    "for Amazon.in"
                ),
                coin_cost=1000,
                reward_type="voucher",
                active=True,
            ),

            Reward(
                id="REW-SWIGGY-100",
                name="Swiggy ₹100 Voucher",
                description=(
                    "Delicious ₹100 voucher "
                    "for food orders on Swiggy"
                ),
                coin_cost=1000,
                reward_type="voucher",
                active=True,
            ),

            Reward(
                id="REW-FLIPKART-250",
                name="Flipkart ₹250 Voucher",
                description=(
                    "₹250 voucher for electronics "
                    "& fashion on Flipkart"
                ),
                coin_cost=2200,
                reward_type="voucher",
                active=True,
            ),

            Reward(
                id="REW-CASHBACK-500",
                name="Cashback ₹500",
                description=(
                    "Direct ₹500 credit back "
                    "to your primary bank account"
                ),
                coin_cost=4500,
                reward_type="cashback",
                active=True,
            ),

            Reward(
                id="REW-TRAVEL-1000",
                name="Travel Voucher ₹1000",
                description=(
                    "₹1000 flight & hotel discount "
                    "voucher on MakeMyTrip"
                ),
                coin_cost=8500,
                reward_type="travel",
                active=True,
            ),
        ]

        db.add_all(rewards_catalogue)

        # -----------------------------------------------------
        # 9. Seed demo user
        # -----------------------------------------------------

        print(
            f"Creating demo user: "
            f"{settings.DEMO_USER_ID}"
        )

        demo_user = User(
            id=settings.DEMO_USER_ID,
            name="Demo User",
            coin_balance=total_earned_coins,
        )

        db.add(demo_user)

        await db.commit()

    # ---------------------------------------------------------
    # 10. Close database engine
    # ---------------------------------------------------------

    await engine.dispose()

    # ---------------------------------------------------------
    # 11. Final report
    # ---------------------------------------------------------

    print("=" * 60)
    print("FINORA SEED COMPLETED SUCCESSFULLY!")
    print("=" * 60)

    print(
        f"Total Records Read:        "
        f"{read_count:,}"
    )

    print(
        f"Total Records Inserted:    "
        f"{inserted_count:,}"
    )

    print(
        f"Total Records Skipped:     "
        f"{skipped_count:,}"
    )

    print(
        f"Duplicate Records:         "
        f"{duplicate_count:,}"
    )

    print(
        f"Normalization Adjustments: "
        f"{normalization_issues:,}"
    )

    print(
        f"Demo User ID:              "
        f"{settings.DEMO_USER_ID}"
    )

    print(
        f"Demo User Initial Coins:   "
        f"{total_earned_coins:,}"
    )

    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_seed())
