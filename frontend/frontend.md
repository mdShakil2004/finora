# Finora Frontend Documentation (`frontend.md`)

## Overview

The **Finora Frontend** is a modern, responsive Single-Page Application (SPA) built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, **Recharts**, and **Lucide Icons**. It connects seamlessly to the FastAPI backend service through an **Express Node.js proxy server** (`server.ts`).

---

## Directory Structure

```text
src/
├── components/
│   ├── ui/                       # Reusable UI primitives (dialogs, cards, badges, buttons)
│   ├── AnalyticsSection.tsx      # Interactive spending charts (Monthly trend & Category donut)
│   ├── FilterBar.tsx             # Multi-faceted filter controls (Search, Category, Status, Date)
│   ├── Navbar.tsx                # Brand header, navigation tabs & live coin balance widget
│   ├── RewardsCatalogue.tsx      # Voucher store & instant redemption modal
│   ├── SummaryCards.tsx          # Key metrics dashboard (Total Spend, Txn Count, Coins)
│   ├── TransactionDetailDrawer.tsx # Slide-over modal with transaction details
│   └── TransactionTable.tsx      # Paginated data table with status badges & coin pills
├── lib/
│   └── utils.ts                  # Helper utilities (formatting currency, dates, classnames)
├── App.tsx                       # Main layout container & state orchestration
├── main.tsx                      # React root entry point
├── types.ts                      # Shared TypeScript interfaces & types
└── index.css                     # Tailwind CSS global styles (@import "tailwindcss";)
server.ts                         # Node.js + Express proxy server managing port 3000 & 8001
```

---

## Architecture & Express Proxy Layer (`server.ts`)

The full-stack application operates on **Port 3000**:
1. **Express Server Initialization**: `server.ts` starts an Express instance listening on `0.0.0.0:3000`.
2. **FastAPI Backend Auto-Spawn**: On startup, `server.ts` automatically spawns the Python FastAPI backend process on port `8001` if it is not already running.
3. **`http-proxy-middleware` Integration**: Intercepts any `/api/*` HTTP requests arriving on port `3000` and proxies them cleanly to `http://127.0.0.1:8001/api/*`.
4. **Vite Development Server**: Serves hot client assets in development mode, or static files from `dist/` in production.

---

## Component Architecture & Functional Modules

### 1. `App.tsx`
* Central controller orchestrating active tabs (`Transactions`, `Analytics`, `Rewards`).
* Fetches overall summary metrics from `/api/transactions/summary` and user balance from `/api/rewards/balance`.
* Manages global filter states (`search`, `category`, `paymentMethod`, `status`, `startDate`, `endDate`, `page`, `pageSize`).
* Displays global notification toasts for redemptions and error alerts.

### 2. `Navbar.tsx`
* Top navigation header featuring the Finora emblem.
* Displays tab navigation controls.
* Houses the **Live Finora Coin Counter Badge** showing real-time balance (e.g., `617,858 Coins`), updating instantly upon voucher redemptions.

### 3. `SummaryCards.tsx`
* Four metric cards providing high-level financial health:
  1. **Total Spend**: Aggregated monetary volume across successful transactions.
  2. **Total Transactions**: Total number of recorded transactions (8,461).
  3. **Success Rate**: Percentage of successful vs failed/refunded transactions.
  4. **Finora Coins Earned**: Cumulative reward coins earned.

### 4. `FilterBar.tsx`
* Multi-criteria filter suite:
  * **Search Input**: Debounced text search matching merchant names or transaction IDs.
  * **Category Filter**: Dropdown with options (`All Categories`, `Shopping`, `Utilities`, `Food & Dining`, `Travel`, etc.).
  * **Status Filter**: Dropdown (`SUCCESS`, `FAILED`, `PENDING`, `REFUNDED`).
  * **Payment Method Filter**: Dropdown (`UPI`, `Credit Card`, `Debit Card`, `Wallet`, `Net Banking`).
  * **Date Range Picker**: Start and end date filters.
  * **Reset Filters Button**: One-click clearing of active filters.

### 5. `TransactionTable.tsx`
* Rich tabular view rendering paginated dataset records.
* **Formatted Data Cells**: Currency values formatted in INR (`₹`), ISO timestamps converted to readable local dates.
* **Status Badges**: Color-coded badges (`Green` for SUCCESS, `Red` for FAILED, `Yellow` for PENDING, `Purple` for REFUNDED).
* **Reward Coin Pills**: Displays earned coins per transaction (`+X Coins`).
* **Pagination Controls**: Page size switcher (`10`, `25`, `50`, `100`), jump-to-page, first/previous/next/last page buttons.
* **Interactive Rows**: Clicking any row opens the `TransactionDetailDrawer`.

### 6. `TransactionDetailDrawer.tsx`
* Slide-over modal providing detailed breakdown of a selected transaction:
  * Full Transaction ID & Status badge.
  * Merchant name & Expense category.
  * Payment method & Timestamp.
  * Coin calculation explanation (1 coin per ₹10 spent up to 500 max).

### 7. `AnalyticsSection.tsx`
* Data visualization dashboard using **Recharts**:
  * **Monthly Spend Trend**: Bar / Area chart displaying spending across months (e.g., 2025-08 to 2026-07).
  * **Category Breakdown**: Donut / Pie chart displaying category distribution.
  * **Interactive Tooltips**: Custom tooltips showing exact amounts and percentage contributions.

### 8. `RewardsCatalogue.tsx`
* Gamified rewards marketplace:
  * Grid of voucher cards (Amazon, Swiggy, Zomato, BookMyShow, Flipkart, etc.).
  * Shows required coin costs (e.g., `1,000 Coins`).
  * Instant **Redeem Button** with client and server balance verification.
  * **Redemption Modal**: Generates and displays a unique voucher code (e.g., `AMZ-8F32-9K1L`) upon successful redemption and immediately updates the global coin balance widget.

---

## Shared TypeScript Types (`src/types.ts`)

```typescript
export interface Transaction {
  id: string;
  timestamp: string;
  merchant: string;
  category: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED' | string;
  payment_method: string;
  reward_coins: number;
}

export interface TransactionSummary {
  total_volume: number;
  total_transactions: number;
  successful_transactions: number;
  total_reward_coins: number;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  coin_cost: number;
  category: string;
  icon: string;
}

export interface RedemptionResult {
  id: string;
  reward_name: string;
  voucher_code: string;
  coins_spent: number;
  new_balance: number;
  redeemed_at: string;
}
```

---

## How to Run Frontend Locally

1. **Install Node Dependencies**:
   ```bash
   npm install
   ```

2. **Start Full-Stack Development Server (Express Proxy + Vite + FastAPI)**:
   ```bash
   npm run dev
   ```

3. Open **`http://localhost:3000`** in your web browser.
