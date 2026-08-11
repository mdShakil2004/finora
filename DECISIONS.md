# Technical Decision Records

This document records the major engineering and architectural decisions made during the development of Finora.

---

## Decision: Frontend Architecture & Framework Choice

### Context

We needed a fast, maintainable, type-safe client framework capable of rendering dynamic financial dashboards, tables, and analytics.

### Decision

Chosen **React 19** with **TypeScript 5.8** bundled by **Vite 6.2**.

### Alternatives Considered

- **Next.js (App Router)** — offers SSR/SSG capabilities.
- **Plain HTML/Vanilla JS** — lightest weight, but difficult to maintain for dynamic state-heavy tables and modals.

### Why

The application is a single-user client-side dashboard without SEO requirements. Vite provides instant hot-module reloading during development and lightweight static asset generation for production.

### Trade-offs

No built-in SSR capabilities, but client-side rendering is ideal for interactive financial tools behind auth/dashboards.

---

## Decision: Component Architecture & Modularity

### Context

A monolith component structure, such as placing all UI logic inside `App.tsx`, creates unmaintainable code and risks token generation limits during AI assistance.

### Decision

Structured the UI into modular single-responsibility components under `src/components/`:

| Component | Responsibility |
|---|---|
| `Navbar.tsx` | Top navigation & live balance badge |
| `SummaryCards.tsx` | High-level metrics |
| `FilterBar.tsx` | Multi-field filter controls |
| `TransactionTable.tsx` | Paginated grid & sort headers |
| `TransactionDetailDrawer.tsx` | Slide-over detail view |
| `AnalyticsSection.tsx` | Recharts charts |
| `RewardsCatalogue.tsx` | Voucher marketplace & redemption modal |
| `ui/` | Primitive UI components (Button, Input, Select, Badge, Toast) |

### Alternatives Considered

- Single mega-component in `App.tsx`.
- Highly atomic design folders (`atoms/`, `molecules/`, `organisms/`).

### Why

Feature-oriented component splitting provides clear separation of concerns, simplifies debugging, and enables component reusability.

### Trade-offs

Requires prop-passing between `App.tsx` and child components, but avoids unnecessary context or global-state complexity.

---

## Decision: State Management Strategy

### Context

The application needs to share state between filters, tables, summary cards, and the live coin balance badge.

### Decision

Used **React Hooks (`useState`, `useCallback`)** with central state orchestration inside `App.tsx`.

### Alternatives Considered

- **Redux Toolkit / Zustand** — global state stores.
- **React Context API** — shared context providers.

### Why

The application's state hierarchy is clean and shallow. Centralizing API fetch logic and filter state in `App.tsx` avoids the boilerplate and verbosity of Redux/Zustand while preserving predictability.

### Trade-offs

Filter state is held in `App.tsx` and passed down to `FilterBar` and `TransactionTable`, but keeps the bundle size small and state transitions obvious.

---

## Decision: Custom Transaction Table Implementation

### Context

The application needs to display paginated transaction records with status badges, INR formatting, sort indicators, and row click handlers.

### Decision

Built a custom, accessible Tailwind CSS table component (`TransactionTable.tsx`).

### Alternatives Considered

- **TanStack Table (React Table)** — headless table library.
- **AG Grid / DataGrid** — feature-heavy enterprise grid.

### Why

A custom Tailwind table provided full design control, lightweight bundle size, and zero external dependency risk while meeting the requirement specifications for pagination, sorting headers, and status badges.

### Trade-offs

Manual wiring of sort column clicks and page-size change handlers, but results in zero third-party grid overhead.

---

## Decision: Server-Side Pagination vs. Virtualization

### Context

The application needs to handle 8,461 transaction records efficiently without unnecessarily loading the entire dataset into browser memory.

### Decision

Implemented **Server-Side SQL Pagination** using `LIMIT` and `OFFSET` clauses.

### Alternatives Considered

- **Client-side Virtualization (`react-window` / `react-virtualized`)** — fetching all 8,461 items at once and rendering only visible rows.

### Why

Server-side pagination provides a scalable architecture for datasets with millions of records. Fetching a small page significantly reduces network transfer compared with loading the complete dataset.

### Trade-offs

Navigating between pages requires a network request rather than instant local slicing, but keeps client-side memory consumption low.

---

## Decision: Server-Side Query Filtering & Search

### Context

Users can search merchants and filter by category, status, date range, and amount range simultaneously.

### Decision

Implemented **Server-Side SQL Filtering** in FastAPI using SQLAlchemy dynamic query building.

### Alternatives Considered

- **Client-Side In-Memory Filtering** — loading all dataset records into browser memory and applying `.filter()` in JavaScript.

### Why

Client-side filtering becomes less suitable as data volume increases because the entire dataset must first be transferred to the browser. Server-side SQL filtering allows the database to perform filtering using indexed columns.

The relevant database indexes include:

- `idx_txn_merchant`
- `idx_txn_category`
- `idx_txn_status`
- `idx_txn_amount`
- `idx_txn_timestamp`

### Trade-offs

Filter changes trigger an API request, but the database performs the filtering close to the data source.

---

## Decision: Search Input Debouncing

### Context

As users type in the merchant search input, sending an API request on every keystroke creates unnecessary backend requests and SQL queries.

### Decision

Added **300ms client-side debouncing** using a `useEffect` timer inside `FilterBar.tsx`.

### Alternatives Considered

- Triggering search only after pressing "Enter" or clicking a "Search" button.
- Sending un-debounced requests on every keyup event.

### Why

Debouncing provides a smooth search-as-you-type experience while reducing unnecessary backend requests during active typing.

### Trade-offs

There is a slight 300ms delay after the user stops typing before the results update.

---

## Decision: Layered Backend Architecture (API → Service → Repository → DB)

### Context

FastAPI route handlers can become difficult to maintain when database queries, business rules, and HTTP serialization are mixed inside individual route functions.

### Decision

Implemented a strict four-layer architecture:

1. **API Controllers** (`backend/app/api/`) — HTTP routing, query parameter parsing, and status codes.
2. **Services** (`backend/app/services/`) — Business logic, reward calculations, and transaction orchestration.
3. **Repositories** (`backend/app/repositories/`) — Database query execution through SQLAlchemy `AsyncSession`.
4. **Models** (`backend/app/models/`) — Declarative SQLAlchemy ORM definitions.

### Alternatives Considered

- Putting database queries directly inside FastAPI route functions ("fat routes").

### Why

Layered separation makes the backend easier to test, maintain, and reuse across different interfaces such as CLI scripts and REST APIs.

### Trade-offs

The architecture introduces additional files and some boilerplate per feature, but provides clearer separation of responsibilities.

---

## Decision: Relational Database Schema & PostgreSQL Target

### Context

Finora requires reliable transaction storage, reward balances, and redemption records with relational consistency.

### Decision

Designed normalized relational tables:

- `transactions`
- `users`
- `rewards`
- `reward_redemptions`

The application uses **SQLAlchemy 2.0 Async** with **PostgreSQL as the production database target**, while SQLite remains supported for zero-configuration local development.

### Alternatives Considered

- NoSQL document store such as MongoDB.
- Non-relational key-value storage.

### Why

Financial transaction and reward workflows benefit from ACID transactions, foreign-key constraints, and relational consistency, including relationships between users, rewards, and redemption records.

### Trade-offs

Requires explicit database configuration and schema/seed setup, but provides stronger data integrity.

---

## Decision: Asynchronous Database Access (SQLAlchemy 2.0 Async)

### Context

FastAPI uses an asynchronous event loop. Synchronous database operations can block the event loop during database I/O.

### Decision

Used SQLAlchemy's **`AsyncSession`** with:

- `asyncpg` for PostgreSQL.
- `aiosqlite` for SQLite local development.

### Alternatives Considered

- Synchronous SQLAlchemy ORM running inside synchronous route handlers.

### Why

Async database I/O allows FastAPI to continue processing other requests while database operations are waiting on I/O.

### Trade-offs

Repository and service methods must use `async`/`await`, which adds some implementation complexity.

---

## Decision: Atomic Reward Redemption & Row Locking

### Context

When a user redeems a voucher, the system must verify the available coin balance, deduct the required coins, and create the redemption record.

Concurrent redemption requests could otherwise introduce race conditions and potentially allow double-spending.

### Decision

Implemented **atomic row locking** using `SELECT ... FOR UPDATE` through `UserRepository.get_by_id_for_update`, wrapped inside a single SQLAlchemy asynchronous transaction.

### Alternatives Considered

- Optimistic locking using version fields.
- Unlocked read-then-write updates.

### Why

Row-level locking ensures that balance verification and coin deduction occur atomically for concurrent redemption requests.

### Trade-offs

The user row remains locked for the short duration of the redemption transaction, which is appropriate for a balance mutation.

---

## Decision: API Request & Response Validation via Pydantic V2

### Context

API input parameters such as page numbers, page sizes, statuses, and response objects need predictable validation.

### Decision

Used **Pydantic V2 schemas** under `backend/app/schemas/` with explicit field constraints.

Example:

```python
Query(..., ge=1, le=100)
```

### Alternatives Considered

- Manual dictionary inspection and validation inside Python code.

### Why

Pydantic integrates directly with FastAPI and provides:

- Automatic request validation.
- OpenAPI/Swagger documentation.
- Structured response serialization.
- Clear HTTP 422 validation errors.

### Trade-offs

Requires explicit schema classes for API requests and responses.

---

## Decision: Centralized HTTP & Application Error Handling

### Context

API errors should use consistent HTTP semantics, including 404 for missing resources, 409 for business conflicts, and 500 for unexpected server errors.

### Decision

Used FastAPI `HTTPException` for expected API errors and centralized exception handling for unexpected application errors.

The frontend handles API errors and displays user-friendly Toast notifications.

### Alternatives Considered

- Returning `200 OK` with an `error` field in the response body.

### Why

Standard HTTP status codes follow REST conventions and make frontend error handling predictable.

### Trade-offs

Frontend API wrappers need to explicitly handle non-success HTTP responses.

---

## Decision: Charting Library Selection (Recharts)

### Context

The application needs to visualize spending trends and category distributions.

### Decision

Chosen **Recharts 3.10**.

### Alternatives Considered

- **Chart.js (`react-chartjs-2`)** — canvas-based charts.
- **D3.js** — low-level custom SVG manipulation.

### Why

Recharts is designed for React and provides declarative chart components, responsive sizing, tooltips, animations, and straightforward integration with the existing frontend.

### Trade-offs

SVG rendering can become expensive with very large numbers of data points, but the backend analytics endpoints aggregate the data before sending it to the frontend.

---

## Decision: Unified Express Proxy Server for Local Development (`server.ts`)

### Context

During local development, the frontend and FastAPI backend run on separate ports, which can introduce CORS configuration and multi-terminal startup complexity.

### Decision

Created a unified Node.js Express server (`server.ts`) for local development that:

- Listens on port `3000`.
- Starts the FastAPI process on port `8001`.
- Proxies `/api/*` requests to FastAPI.

### Alternatives Considered

- Running the frontend and backend separately in different terminals.
- Configuring the frontend to communicate directly with the FastAPI development server.

### Why

The proxy provides a single development entry point and simplifies local API communication.

### Trade-offs

Node.js manages the Python child process during local development, adding some development-environment coupling.

---

## Decision: Idempotent Database Seeding Pipeline (`seed.py`)

### Context

Re-running the seed script should not create duplicate transaction records or repeatedly increase the demo user's reward balance.

### Decision

The `backend/scripts/seed.py` pipeline clears existing seed data before inserting the cleaned transaction dataset and recreating the demo rewards and user balance.

The reset sequence removes records from:

1. `reward_redemptions`
2. `transactions`
3. `rewards`
4. `users`

The pipeline then inserts the cleaned **8,461 transaction records** and recreates the demo state.

### Alternatives Considered

- Append-only seeding with duplicate checks for every record.
- Incremental upsert-based seeding.

### Why

A wipe-and-reseed approach makes repeated test runs deterministic and ensures the database returns to a known state.

### Trade-offs

Existing test redemptions and demo state are removed whenever the seed script is executed. This behavior is appropriate for assessment and test environments but should not be used as a production data-reset mechanism.

---

## Decision: Environment Configuration (`pydantic-settings`)

### Context

Database URLs, CORS origins, demo-user configuration, and application constants need to differ between local and production environments.

### Decision

Used **`pydantic-settings` `BaseSettings`** to load environment configuration from environment variables and `.env` during local development, with safe fallback defaults where appropriate.

### Alternatives Considered

- Hardcoding configuration strings directly in source code.
- Using plain `os.getenv()` without typed configuration.

### Why

`pydantic-settings` provides typed configuration validation and keeps environment-specific values outside the application source code.

### Trade-offs

Requires `pydantic-settings` as a backend dependency and requires production environment variables to be configured correctly.
