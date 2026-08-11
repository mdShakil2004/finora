<div align="center">

# 💰 Finora

### Financial Dashboard & Rewards Engine

A full-stack consumer finance platform for transaction analytics, spending insights, and a rule-based loyalty rewards system.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0_Async-D71F00)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Production-4169E1?logo=postgresql&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Local_Dev-003B57?logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/status-assessment_project-lightgrey)

</div>

---

## Table of Contents

1. [Overview](#1-overview)
2. [Core Workflow](#2-core-workflow)
3. [Features](#3-features)
4. [Architecture](#4-architecture)
5. [Technology Stack](#5-technology-stack)
6. [Project Structure](#6-project-structure)
7. [Database Design](#7-database-design)
8. [Reward System](#8-reward-system)
9. [Seed Data & Normalization](#9-seed-data--normalization)
10. [API Reference](#10-api-reference)
11. [Environment Configuration](#11-environment-configuration)
12. [Local Development](#12-local-development)
13. [Production Deployment](#13-production-deployment)
14. [Testing](#14-testing)
15. [Data Integrity & Error Semantics](#15-data-integrity--error-semantics)
16. [Documentation Set](#16-documentation-set)
17. [Scope: Done / Not Done](#17-scope-done--not-done)
18. [Known Limitations](#18-known-limitations)
19. [Roadmap](#19-roadmap)

---

## 1. Overview

**Finora** is a full-stack consumer finance dashboard and loyalty rewards platform built to help users understand their spending, explore transaction history, and redeem earned reward coins.

The system ingests a raw transaction dataset, normalizes it, persists it in a relational database, exposes it through a versioned REST API, and renders it through an interactive React dashboard — deliberately designed around **server-side data access** rather than shipping the entire dataset to the browser.

**Three functional pillars:**

| Pillar | Description |
|---|---|
| 📊 **Financial Dashboard** | Spending summary, success-rate metrics, reward balance, category and monthly analytics |
| 📒 **Transaction Ledger** | Paginated, searchable, filterable, sortable transaction table with a detail drawer |
| 🎁 **Rewards Catalogue** | Coin balance tracking, voucher catalogue, atomic redemption with race-condition protection |

---

## 2. Core Workflow

```text
transactions.json
        │
        ▼
backend/scripts/seed.py   (parse → normalize → calculate rewards)
        │
        ▼
Database  (SQLite locally · PostgreSQL in production)
        │
        ▼
FastAPI   (REST API — controllers → services → repositories)
        │
        ▼
React Frontend  (Dashboard · Transactions · Analytics · Rewards)
```

---

## 3. Features

### 3.1 Financial Dashboard
- Summary cards: total spending, successful transaction count, success rate %, current coin balance
- Category-level and monthly spending analytics
- Recent transaction preview

### 3.2 Transaction Ledger
- **Table** — ID, date, merchant, category, amount (INR-formatted, e.g. `₹12,450.00`), status badge, payment method, earned coins
- **Server-side pagination** — page sizes of 10 / 25 / 50 / 100 with jump-to-page navigation
- **Merchant search** — debounced (300ms), matches merchant name or transaction ID
- **Filters** — category, status (`SUCCESS` / `FAILED` / `PENDING`), amount range (`min_amount` / `max_amount`), date range (`YYYY-MM-DD`)
- **Sorting** — by date or amount, ascending/descending (default: `timestamp DESC`)
- **Detail drawer** — slide-over panel with full metadata and reward-coin derivation

### 3.3 Analytics
- **Category breakdown** — donut chart of spend volume and transaction count per category
- **Monthly trend** — bar/area chart of spending over time
- **Chart-to-table interaction** — clicking a category slice filters the ledger and switches views automatically:

```text
Category Chart → Category Filter → Transactions API → Filtered Table
```

### 3.4 Rewards
- Live coin balance in the navbar and summary cards
- Voucher catalogue (title, description, coin cost, reward type)
- Redemption confirmation modal with generated voucher code
- Server-side validation: balance sufficiency, active-reward check, atomic row locking
- Instant client-side balance update on success
- Toast notifications for `409 Conflict` (insufficient balance) and server errors

---

## 4. Architecture

### 4.1 System Architecture

```text
┌──────────────────────┐
│   transactions.json  │
└──────────┬────────────┘
           ▼
┌──────────────────────┐
│       seed.py          │  Parse / Normalize / Reward Calculation
└──────────┬────────────┘
           ▼
┌──────────────────────┐
│  SQLite (dev) /       │  transactions · users · rewards · reward_redemptions
│  PostgreSQL (prod)    │
└──────────┬────────────┘
           ▼
┌──────────────────────┐
│       FastAPI          │  API → Service → Repository → SQLAlchemy
└──────────┬────────────┘
           ▼
┌──────────────────────┐
│   React Frontend        │  Dashboard · Transactions · Analytics · Rewards
└──────────────────────┘
```

### 4.2 Backend Layering

```text
API (routing, validation, HTTP status)
 ▼
Service (business logic, reward rules, redemption workflow)
 ▼
Repository (queries, pagination, filtering, sorting)
 ▼
SQLAlchemy ORM
 ▼
Database
```

> **Note on database implementation:** the repository defaults to **SQLite** (`sqlite+aiosqlite:///./finora.db`) for zero-dependency local setup, matching the diagram above. **PostgreSQL** is fully supported via `asyncpg` and is the intended production database — switch by setting `DATABASE_URL`.

---

## 5. Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.8 | Type-safe development |
| Vite | 6.2 | Build tooling & dev server |
| Tailwind CSS | 4.1 | Styling |
| Recharts | 3.10 | Analytics charts |
| Lucide React | — | Icons |
| Motion | — | UI animation |

### Backend

| Technology | Purpose |
|---|---|
| Python 3.10+ | Backend language |
| FastAPI 0.100+ | REST API framework |
| SQLAlchemy 2.0 (Async) | ORM / data access |
| asyncpg | PostgreSQL async driver |
| aiosqlite | SQLite async driver |
| Pydantic V2 + pydantic-settings | Validation & configuration |
| Uvicorn | ASGI server |
| pytest + httpx | Backend testing |

### Database

| Environment | Engine | Driver |
|---|---|---|
| Local development | SQLite (`finora.db`) | `aiosqlite` |
| Production | PostgreSQL | `asyncpg` |

Switch engines at any time via the `DATABASE_URL` environment variable — no code changes required.

---

## 6. Project Structure

```text
finora/
├── README.md
├── ASSUMPTIONS.md
├── DECISIONS.md
├── AI-USAGE.md
│
├── transactions.json          # Raw dataset (8,461 records)
├── finora.db                  # SQLite DB generated by seed.py
│
├── package.json
├── server.ts                  # Express proxy — Vite + spawns FastAPI (local dev)
├── vite.config.ts
│
├── src/                        # React frontend
│   ├── components/
│   │   ├── AnalyticsSection.tsx
│   │   ├── FilterBar.tsx
│   │   ├── Navbar.tsx
│   │   ├── RewardsCatalogue.tsx
│   │   ├── SummaryCards.tsx
│   │   ├── TransactionDetailDrawer.tsx
│   │   ├── TransactionTable.tsx
│   │   └── ui/                 # Button, Input, Select, Badge, Modal, Drawer, Toast, Skeleton, Card
│   ├── lib/
│   │   ├── api.ts              # API client wrappers
│   │   └── utils.ts            # Currency / date formatters
│   ├── App.tsx
│   ├── main.tsx
│   └── types.ts
│
└── backend/                    # FastAPI backend
    ├── app/
    │   ├── api/                 # analytics · health · rewards · transactions
    │   ├── core/                 # config · database · logging
    │   ├── models/               # redemption · reward · transaction · user
    │   ├── repositories/         # DB query layer
    │   ├── schemas/              # Pydantic I/O models
    │   ├── services/             # business logic
    │   └── main.py
    ├── scripts/
    │   └── seed.py
    ├── tests/
    │   ├── test_health.py
    │   ├── test_rewards.py
    │   └── test_transactions.py
    └── requirements.txt
```

---

## 7. Database Design

Four relational tables, defined in `backend/app/models/`.

### 7.1 `transactions`

| Column | Type | Notes |
|---|---|---|
| `id` | `VARCHAR` | Primary key, indexed (e.g. `TXN-101345`) |
| `timestamp` | `TIMESTAMPTZ` | Indexed, UTC-normalized |
| `merchant` | `VARCHAR(255)` | Indexed |
| `category` | `VARCHAR(100)` | Indexed |
| `amount` | `NUMERIC(14,2)` | Indexed, INR |
| `currency` | `VARCHAR(3)` | Defaults to `INR` |
| `status` | `VARCHAR(20)` | Indexed — `SUCCESS` / `FAILED` / `PENDING` |
| `payment_method` | `VARCHAR(50)` | e.g. `UPI`, `Credit Card`, `Debit Card` |
| `created_at` | `TIMESTAMPTZ` | Server insert time |

**Indexes:** `idx_txn_timestamp`, `idx_txn_merchant`, `idx_txn_category`, `idx_txn_status`, `idx_txn_amount`

### 7.2 `users`

| Column | Type | Notes |
|---|---|---|
| `id` | `VARCHAR` | Primary key (`demo-user`) |
| `name` | `VARCHAR(255)` | Account name |
| `coin_balance` | `INTEGER` | Current reward balance |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | — |

### 7.3 `rewards`

| Column | Type | Notes |
|---|---|---|
| `id` | `VARCHAR` | Primary key (e.g. `REW-AMAZON-100`) |
| `name` | `VARCHAR(255)` | Voucher title |
| `description` | `VARCHAR` | Terms/details |
| `coin_cost` | `INTEGER` | Required balance |
| `reward_type` | `VARCHAR(50)` | `voucher` / `cashback` / `travel` |
| `active` | `BOOLEAN` | Availability flag |

### 7.4 `reward_redemptions`

| Column | Type | Notes |
|---|---|---|
| `id` | `VARCHAR` | Primary key (`RED-XXXXXXXX`) |
| `user_id` | `VARCHAR` | FK → `users.id`, indexed |
| `reward_id` | `VARCHAR` | FK → `rewards.id`, indexed |
| `coins_spent` | `INTEGER` | Deducted amount |
| `redeemed_at` | `TIMESTAMPTZ` | Redemption time |

**Relationship:**
```text
users ──< reward_redemptions >── rewards
```

---

## 8. Reward System

### 8.1 Calculation Rule

$$\text{coins} = \min\left(500,\ \left\lfloor \frac{\text{amount}}{100} \right\rfloor\right)$$

> **1 coin per ₹100 spent, capped at 500 coins per transaction.**

### 8.2 Eligibility

A transaction earns coins only when `status == SUCCESS` **and** `amount > 0`.

| Transaction | Coins Earned |
|---|---:|
| `SUCCESS` + positive amount | ✅ Earns coins |
| `SUCCESS` + zero amount | 0 |
| `SUCCESS` + negative amount | 0 |
| `FAILED` | 0 |
| `PENDING` | 0 |

### 8.3 Catalogue

| Reward | Cost |
|---|---:|
| Amazon ₹100 Voucher | 1,000 coins |
| Swiggy ₹100 Voucher | 1,000 coins |
| Flipkart ₹250 Voucher | 2,200 coins |
| Cashback ₹500 | 4,500 coins |
| Travel Voucher ₹1000 | 8,500 coins |

### 8.4 Redemption Flow

```text
User selects reward
        │
        ▼
Frontend sends reward_id
        │
        ▼
FastAPI validates request
        │
        ▼
RewardService locks user row (SELECT ... FOR UPDATE)
        │
        ▼
Balance verified → Coins deducted → Redemption recorded
        │
        ▼
Transaction commits → New balance returned
        │
        ▼
Frontend updates balance + shows success toast
```

**Atomicity:** row-level locking via `SELECT ... FOR UPDATE` prevents concurrent requests from double-spending the same coins.

**Business errors:**
- `404 Not Found` — reward or user does not exist
- `409 Conflict` — insufficient balance or inactive reward

---

## 9. Seed Data & Normalization

| Metric | Value |
|---|---|
| Source file | `transactions.json` |
| Records in dataset | **8,461** |
| Records inserted | **8,461** |
| Duplicates / skipped | **0** |
| Total coins seeded to `demo-user` | **617,858** |

### Normalization Pipeline (`backend/scripts/seed.py`)

1. **Timestamps** — parses Unix seconds/milliseconds, `YYYY/MM/DD`, `YYYY-MM-DD`, and ISO 8601 strings into timezone-aware UTC `datetime`.
2. **Status** — standardizes raw values into `SUCCESS`, `FAILED`, or `PENDING`.
3. **Category** — empty / `null` / `undefined` / `N/A` → `Uncategorized`.
4. **Amount** — converted to `Decimal`, rounded to 2 places (avoids floating-point precision issues).
5. **Reward computation** — applies the coin formula per eligible transaction.
6. **User balance seeding** — sums all earned coins and sets the initial `demo-user` balance.
7. **Idempotency** — clears `reward_redemptions`, `transactions`, `rewards`, and `users` before each re-seed, in that order, for deterministic re-runs.

**Run the seed:**
```bash
PYTHONPATH=. python3 backend/scripts/seed.py
```

> ⚠️ Re-running the seed script **resets** the demo database. This is intentional for deterministic assessment/testing but is **not** a production reset mechanism.

---

## 10. API Reference

Base prefix: **`/api`**

### 10.1 Health

**`GET /api/health`**
Checks API and database connectivity.
```json
{ "status": "ok", "database": "ok" }
```

### 10.2 Transactions

**`GET /api/transactions`** — paginated, filtered, sorted transaction list

| Parameter | Type | Default | Description |
|---|---|---:|---|
| `page` | integer | `1` | Current page |
| `page_size` | integer | `25` | Records per page (max `100`) |
| `search` | string | — | Merchant name or transaction ID |
| `category` | string | — | Category filter |
| `status` | string | — | `SUCCESS` / `FAILED` / `PENDING` |
| `min_amount` / `max_amount` | number | — | Amount range |
| `start_date` / `end_date` | date (`YYYY-MM-DD`) | — | Date range |
| `sort_by` | string | `date` | `date` or `amount` |
| `sort_order` | string | `desc` | `asc` or `desc` |

```text
GET /api/transactions?page=1&page_size=25&status=SUCCESS&sort_by=date&sort_order=desc
```
```json
{ "items": [], "total": 8461, "page": 1, "page_size": 25, "total_pages": 339 }
```

**`GET /api/transactions/{transaction_id}`** — full detail for a single transaction, or `404 Not Found`.

### 10.3 Rewards

**`GET /api/rewards/balance`**
```json
{ "user_id": "demo-user", "coin_balance": 617858 }
```

**`GET /api/rewards`** — active catalogue items
```json
[{ "id": "REW-AMAZON-100", "name": "Amazon ₹100 Voucher", "coin_cost": 1000 }]
```

**`POST /api/rewards/redeem`**
```json
// Request
{ "reward_id": "REW-AMAZON-100" }
```
```json
// 200 OK
{
  "success": true,
  "redemption_id": "RED-1A2B3C4D",
  "coins_spent": 1000,
  "new_balance": 616858
}
```
- `404 Not Found` — reward or user does not exist
- `409 Conflict` — insufficient balance or inactive reward

### 10.4 Analytics

**`GET /api/analytics/categories`**
```json
[{ "category": "Shopping", "amount": 123456.78, "transaction_count": 520 }]
```

**`GET /api/analytics/monthly`**
```json
[{ "month": "2025-08", "amount": 5246585.62 }]
```

---

## 11. Environment Configuration

Managed via `pydantic-settings`. Copy `.env.example` → `.env`.

### Local (SQLite)
```env
DATABASE_URL=sqlite+aiosqlite:///./finora.db
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000
ENVIRONMENT=development
MAX_REWARD_COINS_PER_TRANSACTION=500
DEMO_USER_ID=demo-user
```

### Production (PostgreSQL)
```env
DATABASE_URL=postgresql+asyncpg://USERNAME:PASSWORD@HOST:5432/DATABASE
CORS_ORIGINS=https://your-frontend-domain.com
ENVIRONMENT=production
MAX_REWARD_COINS_PER_TRANSACTION=500
DEMO_USER_ID=demo-user
```

Multiple CORS origins are comma-separated. Credentials should always be supplied through the hosting platform's secret manager — never committed to Git.

---

## 12. Local Development

### Prerequisites
- Node.js ≥ 18.0.0
- Python ≥ 3.10.0
- PostgreSQL *(optional — SQLite is the default)*

### Setup

```bash
# 1. Clone
git clone https://github.com/mdShakil2004/finora.git
cd finora

# 2. Frontend dependencies
npm install

# 3. Backend dependencies
pip install -r backend/requirements.txt

# 4. Environment
cp .env.example .env

# 5. (Optional) switch to PostgreSQL by editing DATABASE_URL in .env

# 6. Seed the database
PYTHONPATH=. python3 backend/scripts/seed.py

# 7. Run
npm run dev
```

`npm run dev` starts the Express proxy on **`http://localhost:3000`** and automatically launches FastAPI on **port `8001`**; all `/api/*` requests are proxied through to the backend.

---

## 13. Production Deployment

> **Status: not yet deployed.** Currently runs in a local container / AI Studio preview environment. The topology below is the intended production setup.

```text
┌────────────────────┐        HTTPS / API        ┌────────────────────┐        ┌────────────────────┐
│   Vercel Frontend   │ ─────────────────────────▶ │   Render Backend    │ ──────▶ │     PostgreSQL      │
│    React + Vite     │                            │      FastAPI        │        │                      │
└────────────────────┘                             └────────────────────┘        └────────────────────┘
```

`server.ts` is a **local-development-only** convenience proxy; in production, FastAPI should be run directly by the hosting platform.

### Backend (Render)

| Setting | Value |
|---|---|
| Build command | `pip install -r backend/requirements.txt` |
| Start command | `python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT` |

Bind to `0.0.0.0` and Render's `$PORT` — never hardcode `8001` in production.

```env
DATABASE_URL=postgresql+asyncpg://USERNAME:PASSWORD@HOST/DATABASE
CORS_ORIGINS=https://your-vercel-frontend.vercel.app
ENVIRONMENT=production
MAX_REWARD_COINS_PER_TRANSACTION=500
DEMO_USER_ID=demo-user
```

**Seeding production:**
```bash
PYTHONPATH=. python backend/scripts/seed.py
```
Run from the repository root — the seed script imports via `from backend.app...`, so `PYTHONPATH` must include the root.

### Frontend (Vercel)

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Root directory | `/` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm install` |

```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```
*(match the exact variable name used by your frontend API client)*

### Schema Management

Currently uses `Base.metadata.create_all` (sufficient for this project's scope). Recommended production evolution:

```text
SQLAlchemy Models → Alembic Migration → PostgreSQL Schema
```

---

## 14. Testing

**Stack:** `pytest` + `httpx` · Location: `backend/tests/`

| Test file | Verifies |
|---|---|
| `test_health.py` | `/api/health` status and DB connectivity |
| `test_rewards.py` | Balance endpoint, catalogue listing, nonexistent-reward handling, atomic redemption & deduction |
| `test_transactions.py` | Pagination, search, category/status filtering, sorting, detail endpoint |

```bash
PYTHONPATH=. pytest backend/tests
```

> ⚠️ **Current status: failing on a default run.** `pytest-asyncio` is required by `@pytest.mark.asyncio` but is **not listed** in `backend/requirements.txt`. Fix:
> ```bash
> pip install pytest-asyncio
> PYTHONPATH=. pytest backend/tests
> ```

---

## 15. Data Integrity & Error Semantics

### HTTP Status Codes

| Status | Meaning |
|---|---|
| `200` | Successful request |
| `404` | Resource not found |
| `409` | Business conflict (e.g. insufficient reward balance) |
| `422` | Invalid request parameters |
| `500` | Unexpected server error |

The frontend surfaces relevant failures as Toast notifications.

### Integrity Controls

- **Duplicate transactions** — tracked and skipped by transaction ID during ingestion.
- **Monetary precision** — all amounts normalized to `Decimal` before persistence.
- **Reward balance integrity** — redemption uses a DB transaction + row lock to prevent double-spending under concurrency.
- **Deterministic seeding** — reset order is `reward_redemptions → transactions → rewards → users`, followed by a clean re-insert (assessment/testing use only, not a production reset path).

---

## 16. Documentation Set

| Document | Purpose |
|---|---|
| `README.md` | Overview, architecture, setup, API, deployment (this file) |
| `ASSUMPTIONS.md` | Product and technical assumptions |
| `DECISIONS.md` | Architecture and engineering decision records |
| `AI-USAGE.md` | AI-assisted development, human review, corrections, verification |

**Key assumptions:** 1 coin per ₹100 spent · 500-coin per-transaction cap · only positive `SUCCESS` transactions earn coins · INR as the operating currency · timestamps normalized to UTC · server-side pagination · date sorting defaults to descending · five seeded rewards · single `demo-user` account · authentication out of scope.

---

## 17. Scope: Done / Not Done

### ✅ Done
- Ingest & normalize 8,461 records from `transactions.json`
- Reward calculation (1 coin/₹100, capped at 500)
- Full-stack REST API (FastAPI + SQLAlchemy 2.0 Async + Pydantic V2)
- Paginated ledger with switchable page sizes (10/25/50/100)
- Search, category/status/date/amount filters, multi-column sorting
- Transaction detail drawer
- Category donut chart & monthly trend chart (Recharts)
- Chart-to-table category filter navigation
- Atomic reward redemption with `SELECT ... FOR UPDATE`
- Express proxy unifying frontend (3000) and backend (8001) for local dev

### ⛔ Not Done
- User authentication / multi-user login (hardcoded `demo-user`)
- Alembic-based migrations (currently `Base.metadata.create_all`)
- Docker / `docker-compose` configuration

---

## 18. Known Limitations

1. **Single demo user** — no authentication or account management.
2. **No migrations** — schema managed via SQLAlchemy metadata, not Alembic.
3. **Seed reset behavior** — reseeding wipes demo data; not safe for production use.
4. **Dev-only proxy** — `server.ts` should not be used in production; run FastAPI directly.
5. **`pytest-asyncio` missing from `requirements.txt`** — test suite fails out of the box until installed manually.
6. **Default DB is SQLite in code**, even though the architecture diagram centers PostgreSQL — switch via `DATABASE_URL` for production-parity testing.

---

## 19. Roadmap

| Area | Planned Improvement |
|---|---|
| **Authentication** | JWT/session-based auth → per-user transactions & rewards |
| **Migrations** | Adopt Alembic for controlled schema evolution |
| **Multi-user rewards** | Replace static `DEMO_USER_ID` with real user identity |
| **Reward fulfillment** | Integrate real voucher providers / cashback settlement |
| **Background processing** | Move large ingestion/analytics jobs to background workers |
| **Observability** | Structured logging, error tracking, metrics, request tracing, DB performance monitoring |
| **Containerization** | Add `Dockerfile` / `docker-compose.yml` |

```text
User Authentication → JWT/Session → Authenticated User ID → User-scoped Transactions & Rewards
```

---

<div align="center">

**Repository:** `https://github.com/mdShakil2004/finora`

*Developed as part of a technical assessment — intended for evaluation and demonstration purposes.*

</div>
