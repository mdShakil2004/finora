
# AI Usage & Verification Record

This document records how AI-assisted development tools were used during the Finora project, how generated output was reviewed and refined, and how the resulting implementation was verified. AI was used as a development aid; final technical decisions, validation, testing, and integration were performed by the developer.

---

## 1. Tools Used

The following AI-assisted development tools were used during the project:

- **Google AI Studio / Antigravity Agent** — powered by Gemini models, including `gemini-3.6-flash`
- **VS Code / AI Coding Environment**

AI assistance was primarily used for implementation acceleration, debugging support, code drafting, documentation, and iterative refinement.

---

## 2. Areas Where AI Assistance Was Used

AI assistance was used across several parts of the application:

### 2.1 Initial Project Scaffolding

AI was used to help establish the initial project structure for:

- React + Vite frontend
- TypeScript configuration
- FastAPI backend
- SQLAlchemy database layer
- API and service organization
- Supporting configuration and documentation files

The generated structure was subsequently reviewed and adapted to the requirements of the assessment.

### 2.2 Frontend Component Development

AI assistance was used to draft and refine initial implementations for several frontend components, including:

- `TransactionTable.tsx`
- `AnalyticsSection.tsx`
- `SummaryCards.tsx`
- `FilterBar.tsx`
- `TransactionDetailDrawer.tsx`
- Rewards catalogue and redemption UI
- Reusable UI components

The generated components were reviewed and modified to ensure consistency with the application's interaction requirements, responsive behavior, and data flow.

### 2.3 Backend API and Data Layer

AI assistance was used during development of:

- SQLAlchemy 2.0 ORM models
- Pydantic V2 schemas
- FastAPI API routes
- Transaction services
- Reward services
- Analytics services
- Health-check endpoint
- Database configuration
- Repository/service separation

The backend implementation was manually reviewed for schema consistency, validation behavior, query logic, and API responses.

### 2.4 Data Seed Pipeline

AI assistance was used to draft and refine:

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
````

The seed pipeline handles:

* Dataset loading
* Timestamp normalization
* Status normalization
* Category normalization
* Amount normalization
* Duplicate detection
* Transaction insertion
* Reward calculation
* Reward catalogue initialization
* Demo-user initialization

The resulting behavior was manually verified against the supplied dataset and assessment requirements.

### 2.5 Documentation

AI assistance was also used to draft and refine:

* `README.md`
* `ASSUMPTIONS.md`
* `DECISIONS.md`
* `AI-USAGE.md`

The documentation was reviewed and edited to reflect the actual implementation rather than relying solely on generated descriptions.

---

## 3. Human Review and Refinement Process

AI-generated output was treated as a starting point rather than as automatically accepted production code.

The implementation was reviewed, tested, and modified before being integrated into the project.

The review process focused on:

* Compliance with the assessment requirements
* Correctness of the PostgreSQL data flow
* Database schema consistency
* API contract consistency
* Transaction filtering and pagination
* Reward calculation logic
* Reward redemption behavior
* Atomic balance deduction
* Input validation
* Error handling
* Type safety
* Environment configuration
* Frontend/backend integration
* Deployment configuration
* Build and runtime behavior

Particular attention was given to cases where generated code made assumptions that were not explicitly supported by the assessment requirements.

---

## 4. Examples of AI Output That Was Rejected or Corrected

The following are concrete examples of generated output that was reviewed and corrected.

### Example 1 — Database Configuration

#### Initial AI-generated approach

An early implementation used a local SQLite database as the primary database configuration:

```text
sqlite+aiosqlite:///./finora.db
```

This was convenient for local development but did not match the intended PostgreSQL-based architecture for the assessment.

#### Why it was changed

The required data flow was:

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

Using SQLite as the primary deployment database would not demonstrate the required PostgreSQL integration.

#### Correction

The implementation was changed to support PostgreSQL through an environment-configured `DATABASE_URL`.

The PostgreSQL async driver was added:

```text
asyncpg
```

The SQLAlchemy database layer was configured to use the environment-provided database URL, allowing the same application code to operate against the deployed PostgreSQL database.

The deployment configuration was also updated so that the production environment supplies the PostgreSQL connection string through environment variables rather than hardcoding credentials in source code.

---

### Example 2 — Reward Coin Calculation

#### Initial AI-generated approach

An early version used:

```python
reward_coins = min(500, int(amount // 10))
```

This represented:

```text
1 coin per ₹10
```

#### Why it was rejected

The assessment requirement specifies:

```text
1 coin per ₹100 spent
```

with a per-transaction cap.

Using ₹10 instead of ₹100 would inflate the reward balance by approximately 10x and would therefore change the application's business behavior.

#### Corrected implementation

The calculation was changed to:

```python
if status == "SUCCESS" and amount > 0:
    coins = min(
        math.floor(float(amount) / 100.0),
        settings.MAX_REWARD_COINS_PER_TRANSACTION
    )
```

Only successful transactions with a positive amount contribute reward coins.

The corrected implementation produced a verified total of:

```text
617,858 coins
```

across the supplied 8,461-transaction dataset.

---

## 5. Verification and Testing

Verification was performed at multiple levels rather than relying only on successful compilation.

### 5.1 Dataset Integrity

The supplied dataset was checked to verify the expected record count:

```bash
python3 -c "import json; print(len(json.load(open('transactions.json'))))"
```

The dataset contained:

```text
8,461 records
```

The seed pipeline was then executed and checked to ensure that the transaction records could be normalized and inserted without unhandled timestamp or field-processing errors.

---

### 5.2 Backend API Verification

The following API areas were tested:

```text
GET  /api/health
GET  /api/transactions
GET  /api/rewards/balance
GET  /api/rewards
POST /api/rewards/redeem
GET  /api/analytics/categories
GET  /api/analytics/monthly
```

The verification covered:

* Successful API responses
* Transaction pagination
* Transaction filtering
* Sorting behavior
* Reward balance retrieval
* Reward catalogue retrieval
* Reward redemption
* Insufficient-balance handling
* Analytics responses
* Invalid/non-existent transaction handling

Specific error cases were also verified, including:

```text
409 Conflict
```

for reward redemption when the user has insufficient coins, and:

```text
404 Not Found
```

when querying a non-existent transaction.

---

### 5.3 Frontend Type and Build Verification

The frontend was checked using the TypeScript compiler:

```bash
npm run lint
```

where the project configuration uses TypeScript checking through:

```bash
tsc --noEmit
```

The production frontend build was also verified:

```bash
npm run build
```

This confirmed that the application could be compiled successfully for deployment.

---

### 5.4 Backend Test Verification

Backend tests were executed using:

```bash
PYTHONPATH=. pytest backend/tests
```

During verification, the test environment exposed a dependency issue: `pytest-asyncio` was not included in the default backend requirements.

This was identified as a test-environment dependency rather than an application runtime failure and was documented accordingly.

---

## 6. Deployment Verification

The deployed application was also tested through the production frontend/backend flow.

The deployment architecture is:

```text
                         ┌─────────────────────┐
                         │ transactions.json   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     seed.py         │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ PostgreSQL / Neon   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   FastAPI Backend   │
                         │      /api/*         │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ React Frontend      │
                         │      Vercel         │
                         └─────────────────────┘
```

Production verification included checking:

* Backend availability
* API routing
* Database connectivity
* Transaction retrieval
* Analytics retrieval
* Rewards retrieval
* Frontend-to-backend communication
* Production build behavior

---

## 7. AI-Assisted Development Principles

The project followed these principles when using AI-assisted development:

1. **AI output was not treated as authoritative.**
2. Generated code was reviewed against the assessment requirements.
3. Business rules were independently checked before implementation.
4. Database and deployment assumptions were explicitly verified.
5. Generated code was modified where it did not match the required architecture.
6. Runtime behavior was tested rather than inferred from generated code.
7. Documentation was updated to reflect the actual implementation and verification results.

The goal was to use AI to accelerate implementation while retaining developer ownership of architecture, technical decisions, validation, and final code quality.

---

## 8. Summary

AI-assisted development significantly accelerated the implementation of the Finora application, particularly for scaffolding, component development, API implementation, debugging, and documentation.

However, generated output was iteratively reviewed and corrected where it conflicted with the assessment requirements or observed runtime behavior.

The final implementation was validated through:

* Dataset verification
* Backend API testing
* Frontend type checking
* Production build verification
* Backend test execution
* Database integration testing
* Deployment verification

This workflow allowed AI assistance to be used as a development accelerator while keeping final implementation decisions and verification under developer control.

```
```
