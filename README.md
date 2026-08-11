# 🏦 Finora — Consumer Finance Analytics & Rewards Platform

[![Stack](https://img.shields.io/badge/Stack-React_18_%7C_FastAPI_%7C_TypeScript_%7C_Tailwind-blue.svg)](https://github.com)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%2FAsync_SQLAlchemy-003B57.svg?logo=sqlite&logoColor=white)](https://www.sqlite.org/)

Finora is an end-to-end, full-stack consumer finance dashboard and dynamic loyalty rewards platform. It ingests, cleans, normalizes, and analyzes over **8,400+ transaction records**, automatically computes rule-based reward coin earnings, visualizes monthly and categorical spending trends, and offers a gamified voucher store with instant redemption capabilities.

---

## 📑 Table of Contents

- [Overview \& Key Capabilities](#-overview--key-capabilities)
- [Architecture \& System Design](#-architecture--system-design)
- [What Has Been Implemented So Far](#-what-has-been-implemented-so-far)
  - [Backend Engineering (Python / FastAPI)](#1-backend-engineering-python--fastapi)
  - [Frontend Engineering (React / TypeScript / Vite)](#2-frontend-engineering-react--typescript--vite)
  - [Data Pipeline \& Seed Engine](#3-data-pipeline--seed-engine)
- [Directory Structure](#-directory-structure)
- [Complete Local Setup Guide](#-complete-local-setup-guide)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone Repository \& Dataset Check](#step-1-clone-repository--dataset-check)
  - [Step 2: Python Virtual Environment Setup](#step-2-python-virtual-environment-setup)
  - [Step 3: Database Ingestion \& Seeding](#step-3-database-ingestion--seeding)
  - [Step 4: Frontend Dependencies \& Running Dev Server](#step-4-frontend-dependencies--running-dev-server)
- [API Endpoints Reference](#-api-endpoints-reference)
- [GitHub Deployment \& Commit Instructions](#-github-deployment--commit-instructions)
- [Troubleshooting](#-troubleshooting)

---

## 🌟 Overview & Key Capabilities

- **💳 High-Volume Transaction Explorer**: Fast, paginated (10, 25, 50, 100 rows/page) transaction grid with debounced multi-field search, status filters (`SUCCESS`, `FAILED`, `PENDING`, `REFUNDED`), category/payment method dropdowns, custom date-range pickers, and slide-over metadata drawers.
- **🪙 Dynamic Rewards Engine**: Server-side rule calculation awarding **1 Finora Coin for every ₹10 spent** on successful transactions (capped at **500 coins max per transaction**).
- **🎁 Real-time Voucher Store**: Marketplace featuring top-brand rewards (Amazon, Flipkart, Swiggy, Zomato, BookMyShow, Uber, Starbucks). Includes balance checking, atomic coin deductions, and unique voucher code generation.
- **📊 Interactive Financial Analytics**: Recharts-powered interactive analytics featuring monthly expenditure trendlines and categorical spending distribution donuts.
- **⚡ Single-Command Full-Stack Execution**: Node.js Express proxy layer (`server.ts`) running on **Port 3000** that automatically spawns and manages the Python FastAPI backend process on **Port 8001**, seamlessly proxying `/api/*` traffic.

---

## 📐 Architecture & System Design

```text
  +-------------------------------------------------------------------------+
  |                               Browser                                   |
  |             React 18 SPA + Tailwind CSS + Recharts + Lucide             |
  +------------------------------------|------------------------------------+
                                       | HTTP Requests (Port 3000)
                                       v
  +-------------------------------------------------------------------------+
  |                    Node.js + Express Proxy Layer                        |
  |    - Serves Vite Frontend Static Assets / HMR                           |
  |    - Proxies /api/* requests to FastAPI (Port 8001)                     |
  |    - Auto-spawns Python FastAPI process on boot                         |
  +------------------------------------|------------------------------------+
                                       | Internal Reverse Proxy
                                       v
  +-------------------------------------------------------------------------+
  |                        FastAPI Python Backend                           |
  |    - Async SQLAlchemy 2.0 ORM + Pydantic V2 Data Validation            |
  |    - Endpoints: /api/transactions, /api/rewards, /api/analytics       |
  +------------------------------------|------------------------------------+
                                       | Async I/O (aiosqlite / asyncpg)
                                       v
  +-------------------------------------------------------------------------+
  |                     Database Layer (finora.db)                          |
  |    - Tables: transactions (8,461 rows), users, rewards, redemptions    |
  +-------------------------------------------------------------------------+
```

---

## 🛠️ What Has Been Implemented So Far

### 1. Backend Engineering (Python / FastAPI)
- **Framework & Runtime**: Built with Python 3.10+, FastAPI, and `uvicorn`.
- **Async Database Stack**: Utilizes SQLAlchemy 2.0 (`AsyncSession`) and `aiosqlite` for zero-friction local execution, ready for PostgreSQL via `asyncpg`.
- **Database Models (`backend/app/models/`)**:
  - `Transaction`: Normalizes transaction ID, timestamp, merchant, category, amount, currency, status, payment method, and calculated reward coins.
  - `User`: Tracks user profile data and live reward coin balances (`coin_balance`).
  - `Reward`: Holds available gift vouchers, coin costs, category tags, and icon metadata.
  - `RedemptionLog`: Maintains an audit trail of redeemed vouchers, timestamps, coins spent, and generated codes.
- **Repository & Service Pattern (`backend/app/repositories/` & `services/`)**:
  - Clean separation of concerns decoupling data access logic from route controllers.
  - Efficient SQL queries using dynamic filters, case-insensitive string matching, date truncations, and dialect-aware SQL date functions (`strftime` for SQLite, `to_char` for PostgreSQL).
- **Pydantic Schemas (`backend/app/schemas/`)**: Strict typing and request/response validation for pagination, filtering options, analytics summaries, and reward redemptions.

### 2. Frontend Engineering (React / TypeScript / Vite)
- **UI & Layout Hierarchy**:
  - `Navbar.tsx`: Features tab navigation and a **Live Finora Coin Balance Widget** that updates in real time upon voucher redemptions.
  - `SummaryCards.tsx`: Top dashboard metric cards showing Total Volume, Transaction Count, Success Rate %, and Cumulative Reward Coins.
  - `FilterBar.tsx`: Multi-filter suite with debounced text search, category picker, status selector, payment method selector, date picker, and reset button.
  - `TransactionTable.tsx`: Responsive table with INR currency formatting (`₹`), color-coded status badges, reward coin tags, row click detail drawers, page size selectors (10/25/50/100), and jump-to-page pagination controls.
  - `TransactionDetailDrawer.tsx`: Slide-over modal showing full transaction detail breakdown and coin derivation math.
  - `AnalyticsSection.tsx`: Dual chart view with monthly spending trend lines and category spending breakdown donut charts.
  - `RewardsCatalogue.tsx`: Interactive voucher card grid with instant redemption modal and voucher code copying.
- **Express Proxy Integration (`server.ts`)**:
  - Solves CORS and port management by hosting everything on port 3000.
  - Auto-spawns `python3 -m uvicorn backend.app.main:app --port 8001` in the background when `npm run dev` or `npm start` is executed.

### 3. Data Pipeline & Seed Engine
- **Dataset Processor (`backend/scripts/seed.py`)**:
  - Parses `transactions.json` (8,461 raw entries) located in the root directory.
  - **Data Sanitization**: Standardizes status variants (e.g. `"Success"` -> `"SUCCESS"`), imputes missing merchants (`"Unknown Merchant"`) and categories (`"Uncategorized"`).
  - **Rewards Calculator**:
    $$\text{reward\_coins} = \begin{cases} \min\left(500, \left\lfloor \frac{\text{amount}}{10} \right\rfloor\right) & \text{if status} = \text{"SUCCESS"} \\ 0 & \text{otherwise} \end{cases}$$
  - Automatically totals earned coins across all records and seeds the initial balance of **617,858 coins** for `demo-user`.
  - Populates 8 voucher rewards in the catalogue.

---

## 📁 Directory Structure

```text
finora/
├── README.md                 # Master Documentation (This File)
├── backendMD.md              # Dedicated Backend Architecture Guide
├── frontend.md               # Dedicated Frontend Architecture Guide
├── transactions.json         # Raw Transaction Dataset (8,461 records)
├── finora.db                 # SQLite Database File (Generated by seed script)
├── package.json              # Frontend dependencies & Node proxy scripts
├── server.ts                 # Express Proxy Server & FastAPI Process Manager
├── vite.config.ts            # Vite Configuration
├── tsconfig.json             # TypeScript Configuration
│
├── src/                      # React Frontend Source Code
│   ├── components/           # Modular UI Components
│   │   ├── AnalyticsSection.tsx      # Spending charts (Recharts)
│   │   ├── FilterBar.tsx             # Multi-faceted filter panel
│   │   ├── Navbar.tsx                # Header & live coin counter badge
│   │   ├── RewardsCatalogue.tsx      # Voucher store & redemption modal
│   │   ├── SummaryCards.tsx          # Metric cards
│   │   ├── TransactionDetailDrawer.tsx # Slide-over transaction details
│   │   ├── TransactionTable.tsx      # Paginated data table
│   │   └── ui/                   # Primitive UI components
│   ├── lib/                  # Utilities (INR currency & date formatters)
│   │   └── utils.ts
│   ├── App.tsx               # Primary layout container & global state
│   ├── main.tsx              # React entry point
│   └── types.ts              # Shared TypeScript definitions
│
└── backend/                  # Python FastAPI Backend Source Code
    ├── app/
    │   ├── api/              # Route controllers
    │   │   ├── analytics.py    # Monthly & category analytics
    │   │   ├── health.py       # Health check endpoint
    │   │   ├── rewards.py      # Coin balance & voucher redemption
    │   │   └── transactions.py # Paginated transaction queries
    │   ├── core/             # Configuration & DB initialization
    │   │   ├── config.py       # App settings & env variables
    │   │   ├── database.py     # Async SQLAlchemy engine & session maker
    │   │   └── logging.py      # App logger setup
    │   ├── models/           # SQLAlchemy ORM models
    │   │   ├── redemption.py   # Redemption log model
    │   │   ├── reward.py       # Reward voucher model
    │   │   ├── transaction.py  # Transaction model
    │   │   └── user.py         # User profile & coin balance model
    │   ├── repositories/     # Database access layer
    │   ├── schemas/          # Pydantic data models
    │   ├── services/         # Core business logic layer
    │   └── main.py           # FastAPI entry point
    ├── scripts/
    │   └── seed.py           # Dataset cleaning & database seeder
    └── requirements.txt      # Python dependencies
```

---

## 🚀 Complete Local Setup Guide

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Python**: `v3.10.0` or higher
- **Git**: Installed

---

### Step 1: Clone Repository & Dataset Check
Clone your repository and ensure `transactions.json` is located in the **root project directory**:

```bash
git clone https://github.com/YOUR_USERNAME/finora.id.git
cd finora
```

---

### Step 2: Python Virtual Environment Setup

#### On macOS / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

#### On Windows (Command Prompt / PowerShell):
```cmd
python -m venv venv
venv\Scripts\activate
pip install -r backend/requirements.txt
```

---

### Step 3: Database Ingestion & Seeding

Process and import the 8,461 records from `transactions.json` into SQLite (`finora.db`):

#### On macOS / Linux:
```bash
PYTHONPATH=. python3 backend/scripts/seed.py
```

#### On Windows Command Prompt:
```cmd
set PYTHONPATH=.
python backend/scripts/seed.py
```

**Console Output Verification:**
```text
Loaded 8461 transactions from transactions.json
Inserted 8461 transactions into database.
Seeded user 'demo-user' with 617858 reward coins.
Seeded 8 rewards into catalogue.
Database seeding completed successfully!
```

---

### Step 4: Frontend Dependencies & Running Dev Server

Install Node dependencies and start the application:

```bash
npm install
npm run dev
```

Open your browser at **`http://localhost:3000`**.

---

## 📡 API Endpoints Reference

| Category | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **System** | `/api/health` | `GET` | Health check and database connection ping |
| **Transactions** | `/api/transactions` | `GET` | Paginated listing with search, filters & sorting |
| **Transactions** | `/api/transactions/summary` | `GET` | Aggregated spend volume, counts & earned coins |
| **Rewards** | `/api/rewards/balance` | `GET` | Fetch live coin balance for user |
| **Rewards** | `/api/rewards` | `GET` | Fetch available voucher catalog |
| **Rewards** | `/api/rewards/redeem` | `POST` | Redeem voucher, deduct coins & issue code |
| **Analytics** | `/api/analytics/monthly` | `GET` | Monthly aggregate spend data |
| **Analytics** | `/api/analytics/categories` | `GET` | Category breakdown aggregate spend data |

---

## 🐙 GitHub Deployment & Commit Instructions

To push this repository to GitHub for the first time:

```bash
# 1. Initialize git (if not already initialized)
git init

# 2. Add all files to staging
git add .

# 3. Create initial commit
git commit -m "feat: complete full-stack finora platform with fastAPI, react & seed engine"

# 4. Set main branch & add remote repository
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/finora.git

# 5. Push code to GitHub
git push -u origin main
```

---

## ❓ Troubleshooting

- **Issue: `ModuleNotFoundError: No module named 'backend'`**
  - **Fix**: Always set `PYTHONPATH=.` when running backend scripts directly:
    `PYTHONPATH=. python3 backend/scripts/seed.py`
- **Issue: Coin balance displays 0**
  - **Fix**: Re-run the seed script to generate `finora.db`:
    `PYTHONPATH=. python3 backend/scripts/seed.py`
- **Issue: Port 3000 or 8001 already in use**
  - **Fix**: Stop existing Node/Python processes or kill the process occupying the port:
    `lsof -ti:3000,8001 | xargs kill -9`
