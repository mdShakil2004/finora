````markdown
# Product & Technical Assumptions

This document outlines the product and technical assumptions made during the implementation of Finora.

---

## Assumption: Reward Coin Calculation Rule

### Context

The assessment prompt states: *"one coin per ₹100 spent, capped per transaction."* The exact numerical cap was intentionally left unspecified.

### Decision

We implemented a reward calculation rule of **1 Finora Coin for every ₹100 spent**, capped at a maximum of **500 coins per transaction**.

$$
\text{reward\_coins} =
\min\left(
500,
\left\lfloor
\frac{\text{amount}}{100}
\right\rfloor
\right)
$$

### Reason

Setting a cap of 500 coins per transaction prevents extreme outlier transactions from disproportionately skewing user coin balances while maintaining a meaningful reward incentive for normal consumer spending.

### Impact

Across the 8,461 transaction dataset, this rule yields an initial balance of **617,858 coins** for the default demo user account.

---

## Assumption: Reward Eligibility & Transaction Status

### Context

The dataset contains transactions with varying statuses such as `SUCCESS`, `FAILED`, `PENDING`, and `REFUNDED`. The brief did not explicitly specify whether unsuccessful transactions should earn reward coins.

### Decision

Only transactions satisfying both conditions earn reward coins:

- `status == "SUCCESS"`
- `amount > 0`

Transactions marked as `FAILED`, `PENDING`, or `REFUNDED` earn **0 coins**.

### Reason

Rewards should only be issued for completed and successful payments. Awarding coins for failed or pending transactions could create incorrect balances and introduce opportunities for abuse.

### Impact

Unsuccessful transactions remain available in the transaction ledger for visibility and auditability but contribute zero coins to the reward balance.

---

## Assumption: Handling of Negative & Zero Transaction Amounts

### Context

The dataset contains edge-case records with negative or zero monetary amounts.

### Decision

Negative and zero-value transactions are retained in the database for ledger completeness but are excluded from reward calculation.

```text
amount <= 0 → 0 reward coins
````

### Reason

Negative amounts may represent refunds, reversals, or credit adjustments. Deducting rewards during initial ingestion without explicitly matching each reversal to its original transaction could produce incorrect reward balances.

### Impact

All transactions remain available for reporting and analytics, while only positive successful transactions contribute to the initial reward balance.

---

## Assumption: Currency Standardization

### Context

The dataset contains currency fields, with the application primarily operating on Indian Rupees.

### Decision

The application uses **INR (`₹`)** as the standard operating currency for the user interface, summary metrics, analytics, and rewards catalogue.

### Reason

Using a single operating currency provides consistent monetary formatting and makes the reward conversion rule deterministic:

```text
1 Finora Coin per ₹100 spent
```

It also keeps voucher pricing consistent with the INR-based consumer experience.

### Impact

Monetary values displayed throughout the application use INR formatting and the `₹` symbol.

---

## Assumption: Heterogeneous Timestamp Normalization

### Context

The `transactions.json` dataset contains timestamps in multiple formats, including:

* Unix timestamps in milliseconds
* Unix timestamps in seconds
* `YYYY/MM/DD HH:MM:SS`
* `YYYY-MM-DD`
* ISO 8601 timestamps

### Decision

The ingestion pipeline in `backend/scripts/seed.py` uses a multi-format timestamp parser that detects the input representation and normalizes it into Python `datetime` objects with UTC timezone information.

### Reason

Consistent timestamps are required for reliable:

* Sorting
* Date-range filtering
* Monthly analytics
* PostgreSQL date/time operations

### Impact

Transaction timestamps are normalized during ingestion and stored consistently, allowing the backend to perform reliable temporal queries and aggregations.

---

## Assumption: Server-Side Pagination

### Context

The dataset contains 8,461 transactions. Rendering the complete dataset in the browser is unnecessary and does not represent a scalable transaction-ledger architecture.

### Decision

The application uses **server-side pagination** with SQL `LIMIT` and `OFFSET`.

Supported page sizes are:

```text
10
25
50
100
```

### Reason

Server-side pagination reduces the amount of data transferred to the client and allows the same API architecture to scale to substantially larger transaction datasets.

It also keeps filtering, sorting, and pagination close to the database where these operations can be efficiently executed.

### Impact

The frontend receives only the requested page together with pagination metadata rather than loading all transactions into the browser.

---

## Assumption: Default Sort Order

### Context

The transaction table requires a deterministic initial ordering.

### Decision

Transactions are sorted by **timestamp descending** by default.

### Reason

A financial transaction dashboard generally prioritizes the most recent activity so users can immediately see their latest transactions.

### Impact

The newest transactions appear first when the transaction ledger is opened. Users can change the sort direction and supported sorting fields through the table controls.

---

## Assumption: Pre-populated Rewards Catalogue

### Context

The assessment requires a rewards catalogue and redemption flow but does not prescribe specific catalogue items or prices.

### Decision

The application uses the following seeded rewards:

| Reward                |        Cost |
| --------------------- | ----------: |
| Amazon ₹100 Voucher   | 1,000 Coins |
| Swiggy ₹100 Voucher   | 1,000 Coins |
| Flipkart ₹250 Voucher | 2,200 Coins |
| Cashback ₹500         | 4,500 Coins |
| Travel Voucher ₹1000  | 8,500 Coins |

### Reason

A predefined catalogue makes the redemption workflow immediately testable and provides different redemption values for reviewers to evaluate.

### Impact

Reviewers can test:

* Available rewards
* Insufficient balance states
* Successful redemption
* Coin balance deduction
* Redemption API behavior

---

## Assumption: Demo User Identity Model

### Context

Authentication, authorization, and multi-user registration are outside the scope of the assessment.

### Decision

The backend operates using a static demo user:

```text
demo-user
```

The demo user is used for:

* Reward balance retrieval
* Reward redemption
* Demo account state
* Transaction-related dashboard operations

### Reason

A fixed demo identity removes authentication overhead and allows reviewers to immediately evaluate the core application functionality.

### Impact

Reviewers can interact with the complete transaction, analytics, and rewards workflows without creating an account or logging in.

---

## Assumption: Timezone Display Handling

### Context

Transaction timestamps need consistent storage while remaining readable to users in different locations.

### Decision

The backend stores timestamps in UTC. The frontend converts timestamps to the user's local timezone using the browser's locale/timezone handling.

### Reason

UTC provides a consistent representation for storage, sorting, filtering, and analytics, while client-side conversion provides a more intuitive display for the end user.

### Impact

The database maintains timezone-consistent transaction data while users see transaction timestamps formatted according to their local browser timezone.

```
```
