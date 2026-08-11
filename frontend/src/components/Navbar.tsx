import React from 'react';
import { Wallet, LayoutDashboard, Receipt, Gift } from 'lucide-react';
import { formatCoins } from '../lib/formatters';

interface NavbarProps {
  activeTab: 'dashboard' | 'transactions' | 'rewards';
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'rewards') => void;
  coinBalance: number | null;
  isLoadingBalance: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  coinBalance,
  isLoadingBalance,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-slate-900 tracking-tight">Finora</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200/50">
                  Rewards Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Smart Financial Dashboard & Loyalty Platform</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'transactions'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Transactions</span>
            </button>

            <button
              onClick={() => setActiveTab('rewards')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'rewards'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>Rewards</span>
            </button>
          </nav>

          {/* User Coin Balance Widget */}
          <div
            onClick={() => setActiveTab('rewards')}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl px-3.5 py-1.5 shadow-xs cursor-pointer hover:border-amber-300 transition-all group"
          >
            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-xs group-hover:scale-105 transition-transform">
              🪙
            </div>
            <div className="text-right">
              <span className="block text-[10px] uppercase tracking-wider font-semibold text-amber-700">
                Finora Coins
              </span>
              <span className="block text-sm font-bold text-amber-950 leading-tight">
                {isLoadingBalance ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  formatCoins(coinBalance ?? 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
