# Finora Backend Documentation (`backendMD.md`)

## Overview

The **Finora Backend** is a high-performance, asynchronous RESTful API service built with **Python 3.10+**, **FastAPI**, **SQLAlchemy 2.0 (Async)**, and **Pydantic V2**. It manages financial transactions, computes dynamic reward coin balances, processes reward catalogue redemptions, and generates real-time analytics for the Finora Consumer Finance Platform.

---

## Directory Structure

```text
backend/
├── app/
│   ├── api/
│   │   ├── analytics.py      # Monthly and category spending aggregation endpoints
│   │   ├── health.py         # System health and database connectivity check
│   │   ├── rewards.py        # Reward balance and voucher redemption endpoints
│   │   └── transactions.py   # Paginated, filtered transaction listing and summaries
│   ├── core/
│   │   ├── config.py         # BaseSettings environment configuration (Pydantic)
│   │   ├── database.py       # Async SQLAlchemy engine and session factory
│   │   └── logging.py        # Structured logging initialization
│   ├── models/
│   │   ├── redemption.py     # SQLAlchemy model for reward redemption logs
│   │   ├── reward.py         # SQLAlchemy model for redeemable rewards
│   │   ├── transaction.py    # SQLAlchemy model for transactions dataset
│   │   └── user.py           # SQLAlchemy model for user profile & coin balance
│   ├── repositories/
│   │   ├── redemption_repository.py
│   │   ├── reward_repository.py
│   │   ├── transaction_repository.py
│   │   └── user_repository.py
│   ├── schemas/
│   │   ├── analytics.py      # Pydantic models for analytical responses
│   │   ├── rewards.py        # Pydantic models for rewards & redemptions
│   │   └── transaction.py    # Pydantic models for transactions and filters
│   ├── services/
│   │   ├── analytics_service.py
│   │   ├── reward_service.py
│   │   └── transaction_service.py
│   └── main.py               # FastAPI application entry point, CORS & exception handlers
├── scripts/
│   └── seed.py               # Data pipeline & normalizer for raw transactions.json
└── requirements.txt          # Python dependencies
```

---

## Data Architecture & Database Models

The database supports both **SQLite** (`sqlite+aiosqlite:///./finora.db`) for lightweight local execution and **PostgreSQL** (`postgresql+asyncpg://...`) for production deployment.

### 1. `Transaction` (`transactions` table)
Stores normalized consumer transaction records loaded from `transactions.json`.
* `id` (`VARCHAR`, Primary Key): Transaction unique ID (e.g., `TXN-101345`).
* `timestamp` (`DATETIME`): ISO transaction timestamp.
* `merchant` (`VARCHAR`): Merchant name (defaults to `"Unknown Merchant"` if missing).
* `category` (`VARCHAR`): Expense category (defaults to `"Uncategorized"` if missing).
* `amount` (`FLOAT`): Transaction value in currency.
* `currency` (`VARCHAR`): Currency code (e.g., `INR`).
* `status` (`VARCHAR`): Standardized transaction status (`SUCCESS`, `FAILED`, `PENDING`, `REFUNDED`).
* `payment_method` (`VARCHAR`): Method used (e.g., `UPI`, `Credit Card`, `Debit Card`, `Wallet`, `Net Banking`).
* `reward_coins` (`INTEGER`): Finora coins earned for this transaction.

### 2. `User` (`users` table)
Stores user accounts and cumulative reward coin balances.
* `id` (`VARCHAR`, Primary Key): User ID (e.g., `demo-user`).
* `name` (`VARCHAR`): User full name.
* `email` (`VARCHAR`): Email address.
* `coin_balance` (`INTEGER`): Current balance of Finora reward coins.

### 3. `Reward` (`rewards` table)
Stores available vouchers and gift cards in the reward catalogue.
* `id` (`VARCHAR`, Primary Key): Reward ID (e.g., `REW-AMAZON-100`).
* `name` (`VARCHAR`): Reward title (e.g., `Amazon ₹100 Voucher`).
* `description` (`TEXT`): Terms and usage description.
* `coin_cost` (`INTEGER`): Required Finora coins to redeem.
* `category` (`VARCHAR`): Voucher category (e.g., `Shopping`, `Food`, `Travel`).
* `icon` (`VARCHAR`): Icon symbol or slug.

### 4. `RedemptionLog` (`redemptions` table)
Logs successful voucher redemption transactions.
* `id` (`VARCHAR`, Primary Key): Redemption ID (`RED-XXXXXX`).
* `user_id` (`VARCHAR`): Foreign key matching `User.id`.
* `reward_id` (`VARCHAR`): Foreign key matching `Reward.id`.
* `coins_spent` (`INTEGER`): Coins deducted.
* `voucher_code` (`VARCHAR`): Generated unique voucher code.
* `redeemed_at` (`DATETIME`): Timestamp of redemption.

---

## Data Pipeline & Ingestion (`backend/scripts/seed.py`)

The seed pipeline reads `transactions.json` from the root directory and normalizes 8,461 raw records:
1. **Cleaning & Standardization**:
   * Standardizes transaction statuses (e.g., converts `"Success"` to `"SUCCESS"`).
   * Imputes missing merchants as `"Unknown Merchant"` and missing categories as `"Uncategorized"`.
   * Cleans amounts and handles dates.
2. **Reward Computation Rule**:
   * Successful transactions earn **1 Finora Coin for every ₹10 spent**, capped at **500 coins maximum per transaction**.
   * Formula: `reward_coins = min(500, int(amount // 10))` for `status == "SUCCESS"`.
3. **User Balance Initialization**:
   * Sums all reward coins earned across all 8,461 transactions and seeds the `demo-user` account with the initial coin balance (e.g., **617,858 coins**).
4. **Catalogue Seeding**:
   * Seeds 8 pre-configured rewards (Amazon, Flipkart, Swiggy, Zomato, BookMyShow, MakeMyTrip, Uber, Starbucks).

---

## API Endpoints Reference

### Health Check
* **`GET /api/health`**
  * Response: `{"status": "ok", "database": "ok"}`

### Transactions
* **`GET /api/transactions`**
  * **Query Parameters**:
    * `page` (int, default: 1)
    * `page_size` (int, default: 20, max: 100)
    * `search` (str, optional): Search by merchant or ID
    * `category` (str, optional)
    * `merchant` (str, optional)
    * `status` (str, optional)
    * `payment_method` (str, optional)
    * `start_date` (str, optional, YYYY-MM-DD)
    * `end_date` (str, optional, YYYY-MM-DD)
    * `sort_by` (str, default: `timestamp`)
    * `sort_order` (str, default: `desc`)
  * Response: Paginated items object containing `{ items: [...], total: int, page: int, page_size: int, total_pages: int }`.

* **`GET /api/transactions/summary`**
  * Response: Summary stats including `total_volume`, `total_transactions`, `successful_transactions`, and `total_reward_coins`.

### Rewards
* **`GET /api/rewards/balance?user_id=demo-user`**
  * Response: `{"user_id": "demo-user", "coin_balance": 617858}`

* **`GET /api/rewards`**
  * Response: List of available reward catalogue items.

* **`POST /api/rewards/redeem`**
  * **Request Body**: `{"reward_id": "REW-AMAZON-100", "user_id": "demo-user"}`
  * Response: `{"id": "RED-123456", "reward_name": "Amazon ₹100 Voucher", "voucher_code": "AMZ-8F32-9K1L", "coins_spent": 1000, "new_balance": 616858, "redeemed_at": "..."}`

### Analytics
* **`GET /api/analytics/monthly`**
  * Response: List of monthly spending totals `[{"month": "2025-08", "amount": 5246585.62}, ...]`. Dialect-aware (uses SQLite `strftime` or PostgreSQL `to_char`).

* **`GET /api/analytics/categories`**
  * Response: List of category spending totals `[{"category": "Shopping", "amount": 123456.78, "transaction_count": 520}, ...]`.

---

## How to Run Backend Locally

1. **Set up virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   ```

2. **Install requirements**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Seed SQLite database**:
   ```bash
   PYTHONPATH=. python3 backend/scripts/seed.py
   ```

4. **Run FastAPI service directly**:
   ```bash
   PYTHONPATH=. python3 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001
   ```
