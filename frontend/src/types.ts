export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface Transaction {
  id: string;
  timestamp: string;
  merchant: string;
  category: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  payment_method: string;
}

export interface PaginatedTransactions {
  items: Transaction[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  coin_cost: number;
  reward_type: string;
  active: boolean;
}

export interface CoinBalance {
  user_id: string;
  coin_balance: number;
}

export interface RedemptionResponse {
  success: boolean;
  redemption_id: string;
  reward: Reward;
  coins_spent: number;
  new_balance: number;
  redeemed_at: string;
}

export interface CategorySpending {
  category: string;
  amount: number;
  transaction_count: number;
}

export interface MonthlySpending {
  month: string;
  amount: number;
}

export interface TransactionFilters {
  search: string;
  category: string;
  status: string;
  minAmount: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
  sortBy: 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
