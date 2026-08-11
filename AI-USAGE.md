# AI Usage & Verification Record

This document details the usage of AI coding assistants, human review workflows, corrections made to AI outputs, and verification procedures for the Finora project, as required for the Digital Alpha Technologies take-home evaluation.

---

## Tools Used

- **Google AI Studio / Antigravity Agent** (powered by Gemini models, including `gemini-3.6-flash`)
- **VS Code / AI Coding Environment**

---

## Where AI Was Used

AI assistance was utilized across the following areas of project development:

1. **Initial Project Scaffolding**: Generating project structure for the React + Vite frontend and FastAPI backend.
2. **Component Implementation**: Drafting initial React UI components for transaction tables (`TransactionTable.tsx`), analytics charts (`AnalyticsSection.tsx`), summary cards (`SummaryCards.tsx`), and filter controls (`FilterBar.tsx`).
3. **Backend Route & Database Models**: Creating SQLAlchemy 2.0 ORM models (`Transaction`, `User`, `Reward`, `RewardRedemption`), Pydantic V2 request/response schemas, and FastAPI API routes (`transactions.py`, `rewards.py`, `analytics.py`, `health.py`).
4. **Data Seed Pipeline**: Drafting the `backend/scripts/seed.py` dataset ingestion script to process `transactions.json`.
5. **Documentation**: Drafting initial architecture summaries, API references, and Technical Decision Records.

---

## Human Review & Refinement Workflow

All AI-generated code was actively reviewed, tested, and modified by the developer prior to integration. The human review process focused on:
- Ensuring strict compliance with the Digital Alpha Technologies assessment specifications.
- Validating database schema consistency, indexes, and relationship constraints.
- Verifying business logic for reward coin calculations, atomic balance deductions, and pagination math.
- Correcting syntax, type definitions, and environment configurations.

---

## Real Examples of AI Output Rejected or Corrected

Below are two explicit, verified examples where initial AI-generated output was rejected or corrected to align with project requirements:

### Example 1: Database Dialect & Configuration Correction

- **What AI Generated**:
  The AI assistant initially configured `backend/app/core/config.py` with a hardcoded SQLite connection string (`sqlite+aiosqlite:///./finora.db`) as the sole database target, without adding PostgreSQL driver dependencies or documenting how to target PostgreSQL.
- **Why It Was Incorrect**:
  The assessment brief specifically specifies PostgreSQL as the target database architecture:
  $$\text{transactions.json} \longrightarrow \text{seed.py} \longrightarrow \text{PostgreSQL} \longrightarrow \text{FastAPI} \longrightarrow \text{Frontend}$$
- **What Was Corrected**:
  The developer added `asyncpg>=0.28.0` to `backend/requirements.txt`, updated `backend/app/core/config.py` to support dynamic environment variable overrides (`DATABASE_URL`), updated `backend/app/core/database.py` with connection pooling settings suitable for PostgreSQL (`pool_size=10, max_overflow=20, pool_pre_ping=True`), and explicitly documented how to switch to PostgreSQL in `README.md`.

---

### Example 2: Reward Coin Calculation Formula Correction

- **What AI Generated**:
  In early iterations of `backend/scripts/seed.py`, the AI generated a reward coin calculation logic using a ratio of **1 coin for every ₹10 spent**:
  ```python
  # AI Generated (INCORRECT):
  reward_coins = min(500, int(amount // 10))
  ```
- **Why It Was Incorrect**:
  The assessment specification explicitly defines the reward calculation rule as:
  > *"one coin per ₹100 spent, capped per transaction."*
  
  Using ₹10 instead of ₹100 inflated user coin earnings by 10x (resulting in over 6.1 million coins instead of ~617k coins).
- **What Was Corrected**:
  The developer identified the discrepancy during code review, rejected the AI-generated ratio, and updated `backend/scripts/seed.py` to use the correct divisor of 100:
  ```python
  # Developer Corrected (CORRECT):
  if status == "SUCCESS" and amount > 0:
      coins = min(math.floor(float(amount) / 100.0), settings.MAX_REWARD_COINS_PER_TRANSACTION)
  ```
  This produced the verified, accurate coin total of **617,858 coins** across the 8,461 transaction dataset.

---

## Verification & Testing Methodology

To ensure system reliability, the following verification checks were performed:

1. **Dataset Integrity Verification**:
   - Ran `python3 -c "import json; print(len(json.load(open('transactions.json'))))"` to verify exact record count (**8,461** records).
   - Executed `PYTHONPATH=. python3 backend/scripts/seed.py` and confirmed 8,461 rows successfully inserted into the database without missing fields or unhandled timestamp errors.

2. **Backend API Testing**:
   - Tested `/api/health`, `/api/transactions`, `/api/rewards/balance`, `/api/rewards`, `/api/rewards/redeem`, `/api/analytics/categories`, and `/api/analytics/monthly` endpoints via HTTP requests.
   - Verified HTTP 409 Conflict response when attempting to redeem vouchers with insufficient coin balance.
   - Verified HTTP 404 response when querying non-existent transaction IDs.

3. **Frontend Build & Type Checks**:
   - Ran `npm run lint` (`tsc --noEmit`) to verify zero TypeScript compiler errors.
   - Ran `npm run build` to verify Vite bundle compilation.

4. **Pytest Execution**:
   - Executed `PYTHONPATH=. pytest backend/tests`.
   - Identified and documented that `pytest-asyncio` is missing from default `backend/requirements.txt`, causing pytest to fail out-of-the-box until `pytest-asyncio` is installed (noted in `README.md`).
