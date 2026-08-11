import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { AnalyticsSection } from './components/AnalyticsSection';
import { FilterBar } from './components/FilterBar';
import { TransactionTable } from './components/TransactionTable';
import { TransactionDetailDrawer } from './components/TransactionDetailDrawer';
import { RewardsCatalogue } from './components/RewardsCatalogue';
import { Toast } from './components/ui/Toast';
import {
  getTransactions,
  getRewardBalance,
  getRewards,
  redeemReward,
  getCategoryAnalytics,
  getMonthlyAnalytics,
} from './lib/api';
import {
  Transaction,
  CoinBalance,
  Reward,
  CategorySpending,
  MonthlySpending,
  TransactionFilters,
} from './types';

interface ToastItem {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'rewards'>('dashboard');

  // Core API State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategorySpending[]>([]);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState<MonthlySpending[]>([]);

  // Loading & Error states
  const [isLoadingTxns, setIsLoadingTxns] = useState(true);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isLoadingRewards, setIsLoadingRewards] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [isTxnError, setIsTxnError] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Selected Transaction for Drawer
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Filter State
  const initialFilters: TransactionFilters = {
    search: '',
    category: '',
    status: '',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    pageSize: 10,
  };

  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);

  // Fetch Transactions
  const fetchTxns = useCallback(async () => {
    setIsLoadingTxns(true);
    setIsTxnError(false);
    try {
      const data = await getTransactions(filters);
      setTransactions(data.items);
      setTotalTransactions(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      setIsTxnError(true);
      console.error(err);
    } finally {
      setIsLoadingTxns(false);
    }
  }, [filters]);

  // Fetch Balance
  const fetchBalance = useCallback(async () => {
    setIsLoadingBalance(true);
    try {
      const data = await getRewardBalance();
      setBalance(data);
    } catch (err) {
      console.error('Error fetching coin balance:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  // Fetch Rewards
  const fetchRewardsData = useCallback(async () => {
    setIsLoadingRewards(true);
    try {
      const data = await getRewards();
      setRewards(data);
    } catch (err) {
      console.error('Error fetching rewards:', err);
    } finally {
      setIsLoadingRewards(false);
    }
  }, []);

  // Fetch Analytics
  const fetchAnalytics = useCallback(async () => {
    setIsLoadingAnalytics(true);
    try {
      const [cats, months] = await Promise.all([
        getCategoryAnalytics(),
        getMonthlyAnalytics(),
      ]);
      setCategoryAnalytics(cats);
      setMonthlyAnalytics(months);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    fetchTxns();
  }, [fetchTxns]);

  useEffect(() => {
    fetchBalance();
    fetchRewardsData();
    fetchAnalytics();
  }, [fetchBalance, fetchRewardsData, fetchAnalytics]);

  // Reset Filters
  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  // Select Category from Donut Chart
  const handleSelectCategoryFromChart = (catName: string) => {
    setFilters((prev) => ({ ...prev, category: catName, page: 1 }));
    setActiveTab('transactions');
  };

  // Handle Sort Toggle
  const handleSortChange = (column: 'date' | 'amount') => {
    setFilters((prev) => {
      if (prev.sortBy === column) {
        return { ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc', page: 1 };
      }
      return { ...prev, sortBy: column, sortOrder: 'desc', page: 1 };
    });
  };

  // Handle Reward Redemption
  const handleRedeemReward = async (rewardId: string) => {
    setIsRedeeming(true);
    try {
      const res = await redeemReward(rewardId);
      setBalance({ user_id: balance?.user_id || 'demo_user_01', coin_balance: res.new_balance });
      addToast('success', `Successfully redeemed ${res.reward.name}!`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to redeem reward';
      addToast('error', errorMsg);
      throw err;
    } finally {
      setIsRedeeming(false);
    }
  };

  // Derived Category Names for Filter Dropdown
  const categoryNames = categoryAnalytics.map((c) => c.category);

  // Derived Stats
  const totalVolume = categoryAnalytics.reduce((acc, c) => acc + c.amount, 0);
  const successfulTxnsCount = categoryAnalytics.reduce((acc, c) => acc + c.transaction_count, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            id={t.id}
            type={t.type}
            message={t.message}
            onClose={removeToast}
          />
        ))}
      </div>

      {/* Main Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        coinBalance={balance?.coin_balance ?? null}
        isLoadingBalance={isLoadingBalance}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* VIEW 1: OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Financial Overview</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Monitor transaction volume, spending insights, and reward activity.
              </p>
            </div>

            <SummaryCards
              totalSpending={totalVolume}
              successfulCount={successfulTxnsCount}
              totalCount={totalTransactions}
              coinBalance={balance?.coin_balance ?? null}
              categoryCount={categoryAnalytics.length}
              isLoading={isLoadingAnalytics}
            />

            <AnalyticsSection
              categoryData={categoryAnalytics}
              monthlyData={monthlyAnalytics}
              onSelectCategory={handleSelectCategoryFromChart}
              isLoading={isLoadingAnalytics}
            />

            <FilterBar
              filters={filters}
              setFilters={setFilters}
              categories={categoryNames}
              onReset={handleResetFilters}
            />

            <TransactionTable
              transactions={transactions}
              total={totalTransactions}
              page={filters.page}
              pageSize={filters.pageSize}
              totalPages={totalPages}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              isLoading={isLoadingTxns}
              isError={isTxnError}
              onPageChange={(newPage) => setFilters((p) => ({ ...p, page: newPage }))}
              onPageSizeChange={(newSize) => setFilters((p) => ({ ...p, pageSize: newSize, page: 1 }))}
              onSortChange={handleSortChange}
              onSelectTransaction={(txn) => setSelectedTxn(txn)}
              onResetFilters={handleResetFilters}
            />
          </div>
        )}

        {/* VIEW 2: TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Transactions Ledger</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Search, filter, and inspect detailed records across all merchant channels.
              </p>
            </div>

            <FilterBar
              filters={filters}
              setFilters={setFilters}
              categories={categoryNames}
              onReset={handleResetFilters}
            />

            <TransactionTable
              transactions={transactions}
              total={totalTransactions}
              page={filters.page}
              pageSize={filters.pageSize}
              totalPages={totalPages}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              isLoading={isLoadingTxns}
              isError={isTxnError}
              onPageChange={(newPage) => setFilters((p) => ({ ...p, page: newPage }))}
              onPageSizeChange={(newSize) => setFilters((p) => ({ ...p, pageSize: newSize, page: 1 }))}
              onSortChange={handleSortChange}
              onSelectTransaction={(txn) => setSelectedTxn(txn)}
              onResetFilters={handleResetFilters}
            />
          </div>
        )}

        {/* VIEW 3: REWARDS TAB */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Rewards Catalogue</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Redeem your earned Finora coins for gift vouchers and cashback.
              </p>
            </div>

            <RewardsCatalogue
              rewards={rewards}
              balance={balance}
              isLoading={isLoadingRewards}
              onRedeem={handleRedeemReward}
              isRedeeming={isRedeeming}
            />
          </div>
        )}
      </main>

      {/* Transaction Detail Side Drawer */}
      <TransactionDetailDrawer
        transaction={selectedTxn}
        isOpen={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          Finora Smart Dashboard & Reward Engine &copy; 2026. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
export default App;
