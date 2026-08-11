# Technical Decision Records

This document records the major engineering and architectural decisions made during the development of Finora.

---

## Decision: Frontend Architecture & Framework Choice

### Context
We needed a fast, maintainable, type-safe client framework capable of rendering dynamic financial dashboards, tables, and analytics.

### Decision
Chosen **React 19** with **TypeScript 5.8** bundled by **Vite 6.2**.

### Alternatives considered
- **Next.js (App Router)**: Offers SSR/SSG capabilities.
- **Plain HTML/Vanilla JS**: Lightest weight, but difficult to maintain for dynamic state-heavy tables and modals.

### Why
The application is a single-user client-side dashboard without SEO requirements. Vite provides instant hot-module reloading during development and lightweight static asset generation for production.

### Trade-offs
No built-in SSR capabilities, but client-side rendering is ideal for interactive financial tools behind auth/dashboards.

---

## Decision: Component Architecture & Modularity

### Context
A monolith component structure (e.g., placing all UI logic inside `App.tsx`) creates unmaintainable code and risks token generation limits during AI assistance.

### Decision
Structured the UI into modular single-responsibility components under `src/components/`:
- `Navbar.tsx`: Top navigation & live balance badge
- `SummaryCards.tsx`: High-level metrics
- `FilterBar.tsx`: Multi-field filter controls
- `TransactionTable.tsx`: Paginated grid & sort headers
- `TransactionDetailDrawer.tsx`: Slide-over detail view
- `AnalyticsSection.tsx`: Recharts charts
- `RewardsCatalogue.tsx`: Voucher marketplace & redemption modal
- `ui/`: Primitive UI components (Button, Input, Select, Badge, Toast)

### Alternatives considered
- Single mega-component in `App.tsx`.
- Highly atomic atomic-design folders (`atoms/`, `molecules/`, `organisms/`).

### Why
Feature-oriented component splitting provides clear separation of concerns, simplifies debugging, and enables component reusability.

### Trade-offs
Requires prop-passing between `App.tsx` and child components, but avoids context over-engineering.

---

## Decision: State Management Strategy

### Context
The application needs to share state between filters, tables, summary cards, and the live coin balance badge.

### Decision
Used **React Native Hooks (`useState`, `useCallback`)** with central state orchestration inside `App.tsx`.

### Alternatives considered
- **Redux Toolkit / Zustand**: Global state stores.
- **React Context API**: Shared context providers.

### Why
The application's state hierarchy is clean and shallow. Centralizing API fetch logic and filter state in `App.tsx` avoids the boilerplate and verbosity of Redux/Zustand while preserving predictability.

### Trade-offs
Filter state is held in `App.tsx` and passed down to `FilterBar` and `TransactionTable`, but keeps the bundle size small and state transitions obvious.

---

## Decision: Custom Transaction Table Implementation

### Context
Displaying paginated transaction records with status badges, INR formatting, sort indicators, and row click handlers.

### Decision
Built a custom, accessible Tailwind CSS table component (`TransactionTable.tsx`).

### Alternatives considered
- **TanStack Table (React Table)**: Headless table library.
- **AG Grid / DataGrid**: Feature-heavy enterprise grid.

### Why
A custom Tailwind table provided full design control, lightweight bundle size, and zero external dependency risk while meeting all requirement specifications (pagination, sorting headers, status badges).

### Trade-offs
Manual wiring of sort column clicks and page size change handlers, but results in zero third-party grid overhead.

---

## Decision: Server-Side Pagination vs. Virtualization

### Context
Handling 8,461 transaction records efficiently without crashing browser memory or sending massive payloads.

### Decision
Implemented **Server-Side SQL Pagination** using `LIMIT` and `OFFSET` clauses.

### Alternatives considered
- **Client-side Virtualization (`react-window` / `react-virtualized`)**: Fetching all 8,461 items at once and rendering only visible rows.

### Why
Server-side pagination scale-proofs the application for datasets with millions of records. Fetching 25 records takes ~5KB of network transfer versus ~1.5MB for all records, significantly improving load times on mobile connections.

### Trade-offs
Navigating between pages requires a quick network request rather than instant local slicing, but keeps client RAM consumption negligible.

---

## Decision: Server-Side Query Filtering & Search

### Context
Users can search merchants, filter by category, status, date range, and amount range simultaneously.

### Decision
Implemented **Server-Side SQL Filtering** in FastAPI using SQLAlchemy dynamic query building.

### Alternatives considered
- **Client-Side In-Memory Filtering**: Loading all dataset records into browser memory and applying `.filter()` in JavaScript.

### Why
Client-side filtering breaks down when data exceeds what can be reasonably transferred in a single API request. Server-side SQL filtering utilizes database B-tree indexes (`idx_txn_merchant`, `idx_txn_category`, `idx_txn_status`, `idx_txn_amount`, `idx_txn_timestamp`), returning filtered results in milliseconds.

### Trade-offs
Filter changes trigger an API fetch, but execution is fast due to indexed DB columns.

---

## Decision: Search Input Debouncing

### Context
As users type in the merchant search input, sending API requests on every keystroke floods the backend server with unnecessary SQL queries.

### Decision
Added **300ms Client-Side Debouncing** using a `useEffect` timer inside `FilterBar.tsx`.

### Alternatives considered
- Triggering search only when pressing "Enter" or clicking a "Search" button.
- Instant un-debounced requests on every keyup event.

### Why
Debouncing provides a smooth "search-as-you-type" experience while reducing backend API load by ~80% during active typing.

### Trade-offs
A slight 300ms delay after typing stops before results update, which is imperceptible and standard UX practice.

---

## Decision: Layered Backend Architecture (API → Service → Repository → DB)

### Context
FastAPI backend route handlers can easily become bloated if database queries, business rules, and HTTP serialization are mixed in single functions.

### Decision
Implemented a strict 4-layer architecture:
1. **API Controllers (`backend/app/api/`)**: HTTP routing, query parameter parsing, and status codes.
2. **Services (`backend/app/services/`)**: Business logic, reward calculations, and atomic transaction orchestration.
3. **Repositories (`backend/app/repositories/`)**: Database query execution via SQLAlchemy AsyncSession.
4. **Models (`backend/app/models/`)**: Declarative SQLAlchemy ORM definitions.

### Alternatives considered
- Putting database queries directly inside FastAPI route functions ("fat routes").

### Why
Layered separation makes the codebase testable, maintainable, and reusable across different interfaces (e.g. CLI scripts vs REST API).

### Trade-offs
Slightly more files and boilerplate per feature, but significantly cleaner code organization.

---

## Decision: Relational Database Schema & PostgreSQL Target

### Context
Choosing the database engine and schema design for financial transaction storage and rewards logging.

### Decision
Designed normalized relational tables (`transactions`, `users`, `rewards`, `reward_redemptions`) using **SQLAlchemy 2.0 Async** targeting **PostgreSQL**, with **SQLite** supported for zero-config local execution.

### Alternatives considered
- NoSQL document store (e.g., MongoDB).
- Non-relational key-value store.

### Why
Financial applications require ACID compliance, foreign key constraints, and relational consistency (e.g., linking a redemption record to both `users` and `rewards`).

### Trade-offs
Requires explicit schema setup/seed commands, but guarantees data integrity.

---

## Decision: Asynchronous Database Access (`SQLAlchemy 2.0 Async`)

### Context
FastAPI uses an asynchronous event loop (`async/await`). Using synchronous database drivers blocks the event loop during DB I/O, degrading concurrent throughput.

### Decision
Used **`AsyncSession`** with `aiosqlite` (for SQLite) and `asyncpg` (for PostgreSQL).

### Alternatives considered
- Synchronous SQLAlchemy ORM running inside `def` synchronous route handlers.

### Why
Async DB I/O allows FastAPI to handle hundreds of concurrent requests per process without thread-blocking.

### Trade-offs
Requires `await` keywords on database queries and async repository methods.

---

## Decision: Atomic Reward Redemption & Row Locking

### Context
When a user redeems a voucher, we must verify their coin balance, deduct the coins, and record the redemption log. Concurrent redemption requests could cause race conditions (e.g., double-spending coins).

### Decision
Implemented **Atomic Row Locking** (`SELECT ... FOR UPDATE` via `UserRepository.get_by_id_for_update`) wrapped inside a single SQLAlchemy async transaction block with explicit `db.commit()` and `db.rollback()`.

### Alternatives considered
- Optimistic locking using version fields.
- Unlocked read-then-write updates.

### Why
Row-level locking guarantees that balance verification and coin deduction occur atomically, preventing double-spending even under high concurrency.

### Trade-offs
Brief lock duration on the user row during redemption, which is standard for financial balance mutations.

---

## Decision: API Request & Response Validation via Pydantic V2

### Context
Input parameter validation (e.g., page numbers $\ge 1$, valid enum statuses) and response serialization must be strict and reliable.

### Decision
Used **Pydantic V2 Schemas** (`backend/app/schemas/`) with strict field constraints (`Query(..., ge=1, le=100)`).

### Alternatives considered
- Manual dictionary inspection and validation in python code.

### Why
Pydantic integrates natively with FastAPI, providing automatic OpenAPI (Swagger) documentation, auto-generated TypeScript-compatible JSON schemas, and clear HTTP 422 error messages for invalid inputs.

### Trade-offs
Requires defining explicit schema classes for requests and responses.

---

## Decision: Centralized HTTP & Application Error Handling

### Context
Error responses should be consistent across all endpoints (e.g. 404 for missing resources, 409 for balance conflicts, 500 for unexpected errors).

### Decision
Utilized FastAPI `HTTPException` with structured JSON detail messages, caught on the client and rendered via Toast notifications.

### Alternatives considered
- Returning `200 OK` with an `error` field in the body.

### Why
Using standard HTTP status codes follows REST best practices and simplifies frontend response handling.

### Trade-offs
Requires explicit exception catching and handling in frontend API client wrappers.

---

## Decision: Charting Library Selection (`Recharts`)

### Context
Visualizing spending trends and category distributions cleanly inside React.

### Decision
Chosen **Recharts 3.10**.

### Alternatives considered
- **Chart.js (`react-chartjs-2`)**: Canvas-based charts.
- **D3.js**: Low-level custom SVG manipulation.

### Why
Recharts is built natively for React using declarative SVG components, offering responsive sizing, built-in tooltips, animations, and clean integration with Tailwind CSS.

### Trade-offs
SVG rendering can slow down if displaying tens of thousands of data points simultaneously, but backend analytics aggregation reduces the data payload to ~10-12 data points.

---

## Decision: Unified Express Proxy Server for Communication (`server.ts`)

### Context
Running frontend on port 3000 and FastAPI backend on port 8001 during local development introduces CORS complexities and multi-terminal startup friction.

### Decision
Created a unified Node.js Express server (`server.ts`) that listens on **Port 3000**, automatically spawns the FastAPI Python process on **Port 8001** in the background, and uses `http-proxy-middleware` to forward `/api/*` traffic seamlessly.

### Alternatives considered
- Requiring developers to open two terminal windows and configure CORS headers manually.

### Why
Provides a single `npm run dev` startup command and eliminates cross-origin browser blocking during preview.

### Trade-offs
Requires Node.js to manage the Python child process during development.

---

## Decision: Idempotent Database Seeding Pipeline (`seed.py`)

### Context
Re-running the seed script multiple times should not create duplicate transactions or balloon user coin balances.

### Decision
The `backend/scripts/seed.py` pipeline executes an atomic deletion of existing table records (`reward_redemptions`, `transactions`, `rewards`, `users`) before re-inserting the cleaned 8,461 transaction records and resetting the user balance.

### Alternatives considered
- Append-only seeding with duplicate checks on every record.

### Why
Idempotent wipe-and-reseed guarantees that running `seed.py` always leaves the database in a known, pristine state.

### Trade-offs
Wipes previous test redemptions during a re-seed, which is desired behavior for resetting test environments.

---

## Decision: Environment Configuration (`pydantic-settings`)

### Context
Managing database URLs, CORS origins, and system constants across development and production environments.

### Decision
Used `pydantic-settings` `BaseSettings` reading from `.env` with fallback default values in `backend/app/core/config.py`.

### Alternatives considered
- Hardcoding configuration strings directly in code.
- Plain `os.getenv()` without type checking.

### Why
Provides type validation and default fallbacks for environment variables, preventing app startup if critical configurations are malformed.

### Trade-offs
Requires adding `pydantic-settings` to backend dependencies.
