import React from 'react';
import { Card } from './ui/Card';
import { IndianRupee, CheckCircle2, Coins, ArrowUpRight, ShoppingBag } from 'lucide-react';
import { formatCurrency, formatCoins } from '../lib/formatters';

interface SummaryCardsProps {
  totalSpending: number;
  successfulCount: number;
  totalCount: number;
  coinBalance: number | null;
  categoryCount: number;
  isLoading: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalSpending,
  successfulCount,
  totalCount,
  coinBalance,
  categoryCount,
  isLoading,
}) => {
  const successRate = totalCount > 0 ? Math.round((successfulCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse h-28 flex flex-col justify-between">
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-8 bg-slate-200 rounded w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Spending */}
      <Card className="relative overflow-hidden bg-white hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Volume</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {formatCurrency(totalSpending)}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Across {successfulCount} successful txns
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </Card>

      {/* Payment Success Rate */}
      <Card className="relative overflow-hidden bg-white hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Success Rate</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{successRate}%</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {successfulCount} / {totalCount} processed
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </Card>

      {/* Finora Reward Balance */}
      <Card className="relative overflow-hidden bg-white hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Coin Balance</p>
            <h3 className="text-2xl font-bold text-amber-900 mt-1">
              {formatCoins(coinBalance ?? 0)}
            </h3>
            <p className="text-xs text-amber-700 font-medium mt-1">
              Available to redeem
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </Card>

      {/* Active Categories */}
      <Card className="relative overflow-hidden bg-white hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categories</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{categoryCount}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Active spend channels
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </Card>
    </div>
  );
};
