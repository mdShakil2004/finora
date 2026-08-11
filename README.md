# Finora — Financial Dashboard & Rewards Engine

## Overview

**Finora** is a full-stack consumer finance application and loyalty rewards platform built for tracking financial transactions, analyzing spending trends, and redeeming earned reward coins. 

The application ingests raw transaction datasets, normalizes transaction metadata, calculates rule-based reward coins for eligible payments, presents spending insights through interactive charts, and manages an atomic voucher redemption store.

### Main User Workflow
1. **Financial Overview / Dashboard**: View high-level metrics (Total Spending, Successful Transaction Count, Success Rate %, and Current Reward Coin Balance), analyze category breakdown and monthly trend charts, and inspect recent transactions.
2. **Transactions Ledger**: Search transactions by merchant name or ID, apply filters (Category, Status, Amount Range, Date Range), sort by date or amount, and view full transaction metadata in a slide-over detail drawer.
3. **Rewards Catalogue**: View active reward vouchers (e.g., Amazon, Swiggy, Flipkart, Cashback), check required coin balances, and perform atomic voucher redemptions with real-time balance updates and voucher code generation.

---

## Features

### Transactions
- **Transaction Table**: Responsive paginated table displaying transaction ID, date, merchant, category, amount (formatted in INR `₹`), status badge, payment method, and earned reward coins.
- **Pagination**: Server-side pagination supporting configurable page sizes (10, 25, 50, 100 items per page) with jump-to-page navigation.
- **Merchant Search**: Debounced search matching merchant names and transaction IDs.
- **Category Filtering**: Dropdown filtering by expense categories (e.g., Shopping, Food & Dining, Utilities, Travel, Entertainment).
- **Payment Status Filtering**: Filter by transaction state (`SUCCESS`, `FAILED`, `PENDING`).
- **Date Range Filtering**: Filter transactions between custom start and end dates (`YYYY-MM-DD`).
- **Amount Range Filtering**: Filter by minimum (`min_amount`) and maximum (`max_amount`) monetary thresholds.
- **Sorting**: Toggle sorting by Date (`timestamp`) or Amount (`amount`) in ascending or descending order.
- **Transaction Detail Drawer**: Slide-over drawer modal rendering detailed transaction metadata, payment method details, and explicit reward coin derivation rules.

### Analytics
- **Spending by Category**: Donut chart displaying spending volume and transaction count distribution across categories.
- **Monthly Spending Trend**: Bar / Area chart displaying aggregated monthly expenditure over time.
- **Chart-to-Table Filtering**: Clicking a category slice on the donut chart automatically filters the transaction table by that category and switches to the transactions view.

### Rewards
- **Visible Coin Balance**: Real-time coin balance badge displayed prominently in the global navigation bar and summary cards.
- **Rewards Catalogue**: Grid of active reward vouchers displaying title, description, required coin cost, and reward type.
- **Redemption Confirmation**: Modal dialog confirming voucher redemption and displaying generated voucher codes upon completion.
- **Backend Validation**: Server-side checks enforcing user balance sufficiency, reward active state, and atomic row locking.
- **Balance Update**: Instant client-side state update following successful API redemption responses.
- **Error Handling**: Friendly toast notifications for insufficient balance (409 Conflict) or server errors.

---

## Architecture

The target system architecture for this assessment is:

```text
transactions.json
      ↓
   seed.py
      ↓
  PostgreSQL
      ↓
   FastAPI
      ↓
  Frontend
```

### Actual Current Database Implementation
- **Current Default State**: The repository's default configuration (`backend/app/core/config.py`) uses **SQLite** (`sqlite+aiosqlite:///./finora.db`) for zero-dependency local setup.
- **PostgreSQL Support**: The codebase uses **SQLAlchemy 2.0 Async** with `asyncpg` (`backend/requirements.txt`), allowing seamless switching to PostgreSQL by setting the `DATABASE_URL` environment variable (e.g., `DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/finora`).

---

## Tech Stack

### Frontend
- **Framework**: React 19 (via Vite 6.2)
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS 4.1
- **Charts**: Recharts 3.10
- **Icons**: Lucide React
- **Animations**: Motion

### Backend
- **Framework**: Python 3.10+ / FastAPI 0.100+
- **ORM**: SQLAlchemy 2.0 (Async)
- **Data Validation**: Pydantic V2 (`pydantic-settings`)
- **Server**: Uvicorn / Node.js Express Proxy (`server.ts`)

### Database
- **SQLite**: Local file database (`finora.db` via `aiosqlite`) used by default.
- **PostgreSQL**: Supported via `asyncpg` driver when `DATABASE_URL` is set to a PostgreSQL connection string.

---

## Project Structure

```text
/
├── README.md                   # Master engineering documentation
├── ASSUMPTIONS.md              # Product and technical assumptions
├── DECISIONS.md                # Architecture and design decision records
├── AI-USAGE.md                 # Record of AI usage, corrections, and verifications
├── transactions.json           # Raw transaction dataset (8,461 records)
├── finora.db                   # SQLite database (generated by seed.py)
├── package.json                # Node.js dependencies and script runners
├── server.ts                   # Express proxy server running Vite & spawning FastAPI
├── vite.config.ts              # Vite configuration
│
├── src/                        # Frontend React Application
│   ├── components/             # React UI components
│   │   ├── AnalyticsSection.tsx      # Spending charts (Recharts)
│   │   ├── FilterBar.tsx             # Search and filter panel
│   │   ├── Navbar.tsx                # Header & live coin counter
│   │   ├── RewardsCatalogue.tsx      # Voucher catalogue & redemption modal
│   │   ├── SummaryCards.tsx          # Key metrics dashboard
│   │   ├── TransactionDetailDrawer.tsx # Slide-over transaction details
│   │   ├── TransactionTable.tsx      # Paginated transaction data table
│   │   └── ui/                   # Reusable UI primitives (Button, Input, Select, Badge, Toast)
│   ├── lib/                    # API client and utility formatters
│   │   ├── api.ts                # Axios/fetch API client wrappers
│   │   └── utils.ts              # Currency & date formatting helpers
│   ├── App.tsx                 # Main application orchestrator
│   ├── main.tsx                # React root entry point
│   └── types.ts                # TypeScript interfaces and data models
│
└── backend/                    # Python FastAPI Backend
    ├── app/
    │   ├── api/                # API endpoint controllers
    │   │   ├── analytics.py      # Category & monthly spending endpoints
    │   │   ├── health.py         # System health check endpoint
    │   │   ├── rewards.py        # Coin balance & voucher redemption endpoints
    │   │   └── transactions.py   # Paginated transaction listing endpoints
    │   ├── core/               # App configuration & DB session factory
    │   │   ├── config.py         # Pydantic Settings & env configuration
    │   │   ├── database.py       # Async SQLAlchemy engine & AsyncSession Local
    │   │   └── logging.py        # Structured logging setup
    │   ├── models/             # SQLAlchemy ORM models
    │   │   ├── redemption.py     # RewardRedemption model
    │   │   ├── reward.py         # Reward model
    │   │   ├── transaction.py    # Transaction model
    │   │   └── user.py           # User model
    │   ├── repositories/       # Data access repository layer
    │   ├── schemas/            # Pydantic request/response schemas
    │   ├── services/           # Business logic layer
    │   └── main.py             # FastAPI app initialization & middleware
    ├── scripts/
    │   └── seed.py             # Ingestion & normalization script
    ├── tests/                  # Backend pytest suite
    │   ├── test_health.py        # Health endpoint tests
    │   ├── test_rewards.py       # Reward service & balance tests
    │   └── test_transactions.py  # Transaction querying & filter tests
    └── requirements.txt        # Python backend package dependencies
```

---

## Database

### Schema Overview
The database schema consists of four relational tables defined in `backend/app/models/`:

1. **`transactions`**:
   - `id` (`VARCHAR`, PK, Indexed): Unique transaction identifier (e.g. `TXN-101345`).
   - `timestamp` (`TIMESTAMPTZ`, Indexed): ISO transaction date and time.
   - `merchant` (`VARCHAR(255)`, Indexed): Merchant name.
   - `category` (`VARCHAR(100)`, Indexed): Expense category.
   - `amount` (`NUMERIC(14,2)`, Indexed): Monetary value in `INR`.
   - `currency` (`VARCHAR(3)`): Currency code (defaults to `INR`).
   - `status` (`VARCHAR(20)`, Indexed): Transaction state (`SUCCESS`, `FAILED`, `PENDING`).
   - `payment_method` (`VARCHAR(50)`): Method used (e.g., `UPI`, `Credit Card`, `Debit Card`).
   - `created_at` (`TIMESTAMPTZ`): Server creation timestamp.

2. **`users`**:
   - `id` (`VARCHAR`, PK): User ID (`demo-user`).
   - `name` (`VARCHAR(255)`): User account name.
   - `coin_balance` (`INTEGER`): Current balance of earned reward coins.
   - `created_at` / `updated_at` (`TIMESTAMPTZ`).

3. **`rewards`**:
   - `id` (`VARCHAR`, PK): Reward identifier (e.g., `REW-AMAZON-100`).
   - `name` (`VARCHAR(255)`): Voucher title.
   - `description` (`VARCHAR`): Details and terms.
   - `coin_cost` (`INTEGER`): Required coins for redemption.
   - `reward_type` (`VARCHAR(50)`): Type tag (`voucher`, `cashback`, `travel`).
   - `active` (`BOOLEAN`): Availability status.

4. **`reward_redemptions`**:
   - `id` (`VARCHAR`, PK): Redemption receipt ID (`RED-XXXXXXXX`).
   - `user_id` (`VARCHAR`, FK -> `users.id`, Indexed): Redeeming user.
   - `reward_id` (`VARCHAR`, FK -> `rewards.id`, Indexed): Redeemed reward item.
   - `coins_spent` (`INTEGER`): Coins deducted.
   - `redeemed_at` (`TIMESTAMPTZ`): Timestamp of redemption.

### Indexes
To optimize search, filtering, and sorting performance across thousands of records, explicit B-tree indexes are defined on `transactions`:
- `idx_txn_timestamp` on `timestamp`
- `idx_txn_merchant` on `merchant`
- `idx_txn_category` on `category`
- `idx_txn_status` on `status`
- `idx_txn_amount` on `amount`

---

## Seed Data

### Dataset & Execution
- **File Location**: `/transactions.json`
- **Total Records in Dataset**: **8,461**
- **Total Records Inserted**: **8,461**
- **Duplicates / Skipped**: **0**

### Normalization Performed
1. **Timestamps**: Parses Unix timestamps (milliseconds and seconds), slash dates (`YYYY/MM/DD`), date-only strings (`YYYY-MM-DD`), and ISO strings into UTC timezone-aware datetimes.
2. **Status**: Standardizes raw status values into `SUCCESS`, `FAILED`, or `PENDING`.
3. **Category**: Cleans empty, `"null"`, `"undefined"`, or `"N/A"` strings into `"Uncategorized"`.
4. **Amount**: Converts raw amounts into `Decimal` rounded to 2 decimal places.
5. **Reward Computation**: For every `SUCCESS` transaction with `amount > 0`, calculates earned coins:
   $$\text{coins} = \min\left(500, \left\lfloor \frac{\text{amount}}{100} \right\rfloor\right)$$
6. **User Balance Seeding**: Calculates the sum of all earned coins across the dataset (**617,858 coins**) and sets the initial balance for `demo-user`.
7. **Idempotency**: Clears existing entries in `reward_redemptions`, `transactions`, `rewards`, and `users` before re-seeding to ensure identical re-runs.

### Seed Command
```bash
PYTHONPATH=. python3 backend/scripts/seed.py
```

---

## API

### Endpoints Summary

#### Health
- `GET /api/health`
  - **Purpose**: System health check & database connectivity test.
  - **Response**: `{"status": "ok", "database": "ok"}`

#### Transactions
- `GET /api/transactions`
  - **Purpose**: Retrieve paginated and filtered transactions.
  - **Query Parameters**:
    - `page` (int, default: 1)
    - `page_size` (int, default: 25, max: 100)
    - `search` (string, optional): Merchant name or ID search.
    - `category` (string, optional): Filter by category.
    - `status` (string, optional): Filter by status (`SUCCESS`, `FAILED`, `PENDING`).
    - `min_amount` / `max_amount` (float, optional): Filter by amount range.
    - `start_date` / `end_date` (string, optional): ISO date range.
    - `sort_by` (string, default: `"date"`): Field to sort by (`"date"`, `"amount"`).
    - `sort_order` (string, default: `"desc"`): `"asc"` or `"desc"`.
  - **Response**: `{ "items": [...], "total": 8461, "page": 1, "page_size": 25, "total_pages": 339 }`

- `GET /api/transactions/{transaction_id}`
  - **Purpose**: Get full detail for a single transaction.
  - **Response**: Full transaction object or `404 Not Found`.

#### Rewards
- `GET /api/rewards/balance`
  - **Purpose**: Retrieve current coin balance for the demo user.
  - **Response**: `{"user_id": "demo-user", "coin_balance": 617858}`

- `GET /api/rewards`
  - **Purpose**: Retrieve active rewards catalogue items.
  - **Response**: List of reward voucher objects.

- `POST /api/rewards/redeem`
  - **Purpose**: Redeem a voucher using reward coins.
  - **Request Body**: `{"reward_id": "REW-AMAZON-100"}`
  - **Response Behavior**:
    - `200 OK`: `{"success": true, "redemption_id": "RED-1A2B3C4D", "coins_spent": 1000, "new_balance": 616858, ...}`
    - `404 Not Found`: Reward or user not found.
    - `409 Conflict`: Insufficient coin balance or inactive reward.

#### Analytics
- `GET /api/analytics/categories`
  - **Purpose**: Retrieve aggregated total spend and transaction count grouped by category.
  - **Response**: `[{"category": "Shopping", "amount": 123456.78, "transaction_count": 520}, ...]`

- `GET /api/analytics/monthly`
  - **Purpose**: Retrieve aggregated spending totals grouped by month (`YYYY-MM`).
  - **Response**: `[{"month": "2025-08", "amount": 5246585.62}, ...]`

---

## Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10.0 or higher
- **PostgreSQL** (optional; SQLite is used by default if omitted)

### Step-by-Step Setup Guide

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd finora
   ```

2. **Install Frontend Dependencies**:
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

5. **(Optional) Configure PostgreSQL**:
   To use PostgreSQL instead of default SQLite, update `.env`:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/finora
   ```

6. **Seed Database**:
   ```bash
   PYTHONPATH=. python3 backend/scripts/seed.py
   ```

7. **Start Application**:
   ```bash
   npm run dev
   ```
   *This starts the Express proxy on `http://localhost:3000` and automatically launches FastAPI on port `8001`.*

---

## Environment Variables

Defined in `.env.example`:

```env
DATABASE_URL=sqlite+aiosqlite:///./finora.db
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000
ENVIRONMENT=development
MAX_REWARD_COINS_PER_TRANSACTION=500
DEMO_USER_ID=demo-user
```

---

## Testing

- **Framework**: `pytest` + `httpx`
- **Test Suite Location**: `backend/tests/`
  - `test_health.py`: Verifies `/api/health` status and DB connection.
  - `test_rewards.py`: Verifies balance endpoint, catalogue listing, nonexistent reward handling, and successful atomic redemption balance deduction.
  - `test_transactions.py`: Verifies pagination, search, status/category filtering, sorting, and detail endpoints.

### How to Run Tests
```bash
PYTHONPATH=. pytest backend/tests
```

### Current Test Execution Status
- **Execution Result**: **FAILING ON DEFAULT RUN**
- **Root Cause**: The test files rely on `@pytest.mark.asyncio`, but the `pytest-asyncio` plugin is not included in `backend/requirements.txt`. Installing `pytest-asyncio` allows the test suite to execute natively.

---

## Deployment

- **Deployment Status**: **NOT DEPLOYED**
- **Environment**: Local Cloud Run container / AI Studio preview environment.

---

## Documentation Links

- 📖 [Assumptions (`ASSUMPTIONS.md`)](./ASSUMPTIONS.md)
- 📖 [Technical Decisions (`DECISIONS.md`)](./DECISIONS.md)
- 📖 [AI Usage & Verification (`AI-USAGE.md`)](./AI-USAGE.md)

---

## Done / Not Done / Known Issues

### Done
- [x] Ingest and normalize 8,461 transaction records from `transactions.json`.
- [x] Calculate reward coins based on 1 coin per ₹100 spent (max 500 coins per transaction).
- [x] Full-stack REST API with FastAPI, SQLAlchemy 2.0 Async, and Pydantic validation.
- [x] Paginated transactions table with page size switching (10, 25, 50, 100).
- [x] Search, category filter, status filter, date range filter, and amount range filter.
- [x] Multi-column sorting (Date & Amount).
- [x] Transaction detail slide-over drawer.
- [x] Interactive Recharts analytics (Category donut chart & Monthly trend bar chart).
- [x] Chart-to-table category filter navigation.
- [x] Rewards catalogue with atomic coin deduction and row locking (`SELECT ... FOR UPDATE`).
- [x] Unified Express Node.js proxy server forwarding requests from port 3000 to port 8001.

### Not Done
- [ ] User authentication / multi-user login (currently hardcoded to `demo-user`).
- [ ] Automated database migrations using Alembic (currently relies on `Base.metadata.create_all`).
- [ ] Docker containerization config (`Dockerfile` / `docker-compose.yml`).

### Known Issues
- `pytest-asyncio` missing from `backend/requirements.txt`, causing `pytest` to fail out-of-the-box unless installed.
- Default database in code is SQLite (`sqlite+aiosqlite:///./finora.db`) rather than PostgreSQL, though PostgreSQL is fully supported when `DATABASE_URL` is set to a PostgreSQL URI.
