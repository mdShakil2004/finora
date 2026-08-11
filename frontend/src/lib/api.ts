import {
  PaginatedTransactions,
  Transaction,
  Reward,
  CoinBalance,
  RedemptionResponse,
  CategorySpending,
  MonthlySpending,
  TransactionFilters,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function getTransactions(filters: TransactionFilters): Promise<PaginatedTransactions> {
  const params = new URLSearchParams();
  
  params.append('page', filters.page.toString());
  params.append('page_size', filters.pageSize.toString());
  params.append('sort_by', filters.sortBy);
  params.append('sort_order', filters.sortOrder);

  if (filters.search) params.append('search', filters.search);
  if (filters.category) params.append('category', filters.category);
  if (filters.status) params.append('status', filters.status);
  if (filters.minAmount) params.append('min_amount', filters.minAmount);
  if (filters.maxAmount) params.append('max_amount', filters.maxAmount);
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);

  const response = await fetch(`${API_BASE_URL}/transactions?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }
  return response.json();
}

export async function getTransaction(id: string): Promise<Transaction> {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}`);
  if (!response.ok) {
    throw new Error('Transaction not found');
  }
  return response.json();
}

export async function getRewardBalance(): Promise<CoinBalance> {
  const response = await fetch(`${API_BASE_URL}/rewards/balance`);
  if (!response.ok) {
    throw new Error('Failed to fetch reward balance');
  }
  return response.json();
}

export async function getRewards(): Promise<Reward[]> {
  const response = await fetch(`${API_BASE_URL}/rewards`);
  if (!response.ok) {
    throw new Error('Failed to fetch rewards catalogue');
  }
  return response.json();
}

export async function redeemReward(rewardId: string): Promise<RedemptionResponse> {
  const response = await fetch(`${API_BASE_URL}/rewards/redeem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reward_id: rewardId }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Redemption failed');
  }
  return data;
}

export async function getCategoryAnalytics(): Promise<CategorySpending[]> {
  const response = await fetch(`${API_BASE_URL}/analytics/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch category analytics');
  }
  return response.json();
}

export async function getMonthlyAnalytics(): Promise<MonthlySpending[]> {
  const response = await fetch(`${API_BASE_URL}/analytics/monthly`);
  if (!response.ok) {
    throw new Error('Failed to fetch monthly analytics');
  }
  return response.json();
}
