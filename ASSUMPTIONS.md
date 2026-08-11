# Product & Technical Assumptions

This document outlines the product and technical assumptions made during the implementation of Finora.

---

## Assumption: Reward Coin Calculation Rule

### Context

The assessment prompt states: *"one coin per ₹100 spent, capped per transaction."* The exact numerical cap was intentionally left unspecified.

### Decision

We implemented a reward calculation rule of **1 Finora Coin for every ₹100 spent**, capped at a maximum of **500 coins per transaction**.

$$
\text{reward\_coins} = \min\left(500,\ \left\lfloor \frac{\text{amount}}{100} \right\rfloor\right)
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

Only transactions satisfying **both** conditions earn reward coins:

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
```
