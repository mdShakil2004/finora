# Product & Technical Assumptions

This document outlines the product and technical assumptions made during the implementation of Finora.

---

## Assumption: Reward Coin Calculation Rule

### Context
The assessment prompt states: *"one coin per ₹100 spent, capped per transaction."* The exact numerical cap was intentionally left unspecified.

### Decision
We implemented a reward calculation rule of **1 Finora Coin for every ₹100 spent**, capped at a maximum of **500 coins per transaction**.
$$\text{reward\_coins} = \min\left(500, \left\lfloor \frac{\text{amount}}{100} \right\rfloor\right)$$

### Reason
Setting a cap of 500 coins per transaction prevents extreme outlier transactions (e.g., high-value corporate transfers or large equipment purchases) from skewing user coin balances while maintaining strong incentive engagement for standard consumer transactions.

### Impact
Across the 8,461 transaction dataset, this rule yields an initial balance of **617,858 coins** for the default demo user account.

---

## Assumption: Reward Eligibility & Transaction Status

### Context
The dataset contains transactions with varying statuses (`SUCCESS`, `FAILED`, `PENDING`, `REFUNDED`). The brief did not specify whether failed or pending payments earn reward coins.

### Decision
Only transactions with `status == "SUCCESS"` and a strictly positive amount (`amount > 0`) earn reward coins. Transactions marked as `FAILED`, `PENDING`, or `REFUNDED` earn **0 coins**.

### Reason
Financially sound loyalty programs must only award benefits for completed, cleared payments. Awarding coins on failed or pending transactions would create financial exposure and abuse vectors.

### Impact
Failed and pending transactions are tracked and visible in the transactions ledger for audit purposes, but contribute `0` to the user's reward coin total.

---

## Assumption: Handling of Negative & Zero Transaction Amounts

### Context
The dataset includes edge-case records with negative or zero monetary amounts.

### Decision
Negative amounts (e.g. refunds or credit adjustments) and zero-amount entries are normalized and inserted into the database for ledger completeness, but are excluded from coin calculation (`amount > 0` check).

### Reason
Negative amounts represent reversals or internal entries. Deducting coins retrospectively during initial dataset ingestion without individual line-item matching against previous positive transactions could produce invalid negative coin balances.

### Impact
Transactions with `amount <= 0` earn 0 coins during ingestion.

---

## Assumption: Currency Standardization

### Context
Transactions in the dataset specify currency fields, mostly defaulting to Indian Rupees (`INR`).

### Decision
The application assumes **INR (`₹`)** as the uniform operating currency across the user interface, summary metrics, and voucher catalogue.

### Reason
Standardizing on INR ensures consistent UI formatting, unambiguous reward coin conversions (1 coin per ₹100), and straightforward voucher pricing (e.g., ₹100 Amazon Voucher = 1,000 Coins).

### Impact
All monetary values across tables, summary cards, and charts are formatted using `INR` locale rules (`₹`).

---

## Assumption: Heterogeneous Timestamp Normalization

### Context
The `transactions.json` dataset contains raw timestamps in multiple inconsistent formats: Unix timestamps in milliseconds (e.g., `1773586930000`), Unix timestamps in seconds, slash-formatted strings (`YYYY/MM/DD HH:MM:SS`), date-only strings (`YYYY-MM-DD`), and ISO 8601 strings.

### Decision
The ingestion script (`seed.py`) implements a resilient multi-format parser (`parse_timestamp`) that detects the input format, normalizes dates into standard Python `datetime` objects, and explicitly attaches UTC timezone information (`timezone.utc`).

### Reason
Inconsistent timestamps prevent accurate SQL range filtering, monthly trend grouping, and sorting. Standardizing during seed ingestion guarantees date integrity across PostgreSQL/SQLite.

### Impact
All 8,461 records in the database feature valid UTC ISO timestamps, enabling precise monthly analytics aggregations.

---

## Assumption: Server-Side Pagination vs. Client-Side Virtualization

### Context
The dataset contains 8,461 transactions, which is too large for unpaginated client-side DOM rendering but small enough to fit in memory on modern servers.

### Decision
We chose **Server-Side Pagination** with SQL `LIMIT` and `OFFSET` clauses, supporting page sizes of 10, 25, 50, and 100 records per page.

### Reason
Server-side pagination simulates realistic production architecture where transaction volumes scale into millions of rows. It minimizes network transfer payloads (~5KB per page vs ~1.5MB for the full dataset) and ensures fast initial page loads.

### Impact
The client receives only the current page of items along with total count metadata, maintaining instant UI rendering responsiveness.

---

## Assumption: Default Sort Order

### Context
The UI needs an initial sort order when users open the transactions table.

### Decision
Transactions are sorted by **Date (`timestamp`) descending (`desc`)** by default.

### Reason
Financial dashboards prioritize showing recent activity first. Users expect to see their latest transactions at the top of the table.

### Impact
The table displays the newest records first upon initial render, with controls to switch to ascending order or sort by transaction amount.

---

## Assumption: Pre-populated Rewards Catalogue

### Context
The assessment requires a rewards catalogue and redemption flow, but did not specify exact catalog inventory items or pricing.

### Decision
We created a seeded catalogue of 5 brand vouchers:
1. **Amazon ₹100 Voucher**: 1,000 Coins
2. **Swiggy ₹100 Voucher**: 1,000 Coins
3. **Flipkart ₹250 Voucher**: 2,200 Coins
4. **Cashback ₹500**: 4,500 Coins
5. **Travel Voucher ₹1000**: 8,500 Coins

### Reason
Preset pricing establishes a clear 10:1 coin-to-rupee redemptive value ratio, giving users tangible goals to test the redemption workflow.

### Impact
Users can test successful redemptions, observe coin balance deductions, and verify error states when attempting to redeem with insufficient balance.

---

## Assumption: Demo User Identity Model

### Context
User authentication, authorization, and multi-tenant user registration were out of scope for the assessment.

### Decision
The backend operates against a static single demo user account (`demo-user`). All balance checks, transactions summary counts, and voucher redemptions read and mutate `demo-user`.

### Reason
Using a fixed demo user removes authentication friction for reviewers while maintaining realistic database state management and row locking (`SELECT ... FOR UPDATE`).

### Impact
Reviewers can immediately interact with the application and redeem rewards without creating an account or logging in.

---

## Assumption: Timezone Display Handling

### Context
Database timestamps are stored in UTC, but users operate in local timezones.

### Decision
The backend stores all timestamps as UTC ISO-8601 strings (`TIMESTAMPTZ`), and the frontend converts them to the user's local timezone using standard browser locale formatters (`toLocaleString()`).

### Reason
Storing UTC in the database prevents timezone ambiguity in analytical aggregations, while client-side conversion provides an intuitive experience for end users.

### Impact
Transaction timestamps render cleanly in local time across client browsers.
