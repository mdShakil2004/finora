import React from 'react';
import { Transaction, TransactionStatus } from '../types';
import { formatCurrency, formatDate } from '../lib/formatters';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Inbox, AlertTriangle } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy: 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  isError: boolean;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  onSortChange: (column: 'date' | 'amount') => void;
  onSelectTransaction: (txn: Transaction) => void;
  onResetFilters: () => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  total,
  page,
  pageSize,
  totalPages,
  sortBy,
  sortOrder,
  isLoading,
  isError,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onSelectTransaction,
  onResetFilters,
}) => {
  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge variant="success">Success</Badge>;
      case 'FAILED':
        return <Badge variant="failed">Failed</Badge>;
      case 'PENDING':
        return <Badge variant="pending">Pending</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const renderSortIcon = (column: 'date' | 'amount') => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
    );
  };

  if (isError) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center my-6">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900">Failed to load transactions</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">An error occurred while communicating with the database server.</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Retry Request
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Header Action Bar */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h2 className="text-base font-bold text-slate-900">Transaction History</h2>
          <p className="text-xs text-slate-500">
            Showing {total > 0 ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)} of {total} records
          </p>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-medium text-slate-500">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Main Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold text-slate-600">
              <th className="py-3 px-6">Merchant & Category</th>
              <th className="py-3 px-6 cursor-pointer group" onClick={() => onSortChange('date')}>
                <div className="flex items-center gap-1.5">
                  <span>Date</span>
                  {renderSortIcon('date')}
                </div>
              </th>
              <th className="py-3 px-6">Payment Method</th>
              <th className="py-3 px-6 cursor-pointer group text-right" onClick={() => onSortChange('amount')}>
                <div className="flex items-center justify-end gap-1.5">
                  <span>Amount</span>
                  {renderSortIcon('amount')}
                </div>
              </th>
              <th className="py-3 px-6 text-center">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-sm">
            {isLoading ? (
              // Skeleton Rows
              Array.from({ length: pageSize }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-6">
                    <div className="h-4 bg-slate-200 rounded w-36 mb-1" />
                    <div className="h-3 bg-slate-100 rounded w-20" />
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 bg-slate-200 rounded w-24" />
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 bg-slate-200 rounded w-20" />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="h-4 bg-slate-200 rounded w-20 ml-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="h-5 bg-slate-200 rounded-full w-16 mx-auto" />
                  </td>
                </tr>
              ))
            ) : transactions.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={5} className="py-12 px-6 text-center">
                  <div className="max-w-xs mx-auto">
                    <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-800">No transactions found</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      Try adjusting your search criteria or resetting filters.
                    </p>
                    <Button variant="outline" size="sm" onClick={onResetFilters}>
                      Clear All Filters
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              transactions.map((txn) => (
                <tr
                  key={txn.id}
                  onClick={() => onSelectTransaction(txn)}
                  className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-6">
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {txn.merchant}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">{txn.category}</div>
                  </td>
                  <td className="py-3.5 px-6 text-xs text-slate-600 whitespace-nowrap">
                    {formatDate(txn.timestamp)}
                  </td>
                  <td className="py-3.5 px-6 text-xs text-slate-600 capitalize">
                    {txn.payment_method.replace('_', ' ')}
                  </td>
                  <td className="py-3.5 px-6 text-right font-bold text-slate-900 whitespace-nowrap">
                    {formatCurrency(txn.amount, txn.currency)}
                  </td>
                  <td className="py-3.5 px-6 text-center whitespace-nowrap">
                    {getStatusBadge(txn.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && totalPages > 1 && (
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalPages}</span>
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-2.5"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>

            {/* Quick Page Number buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = page - 2 + i;
                if (page <= 2) pageNum = i + 1;
                if (page >= totalPages - 1) pageNum = totalPages - 4 + i;
                if (pageNum <= 0 || pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                      pageNum === page
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-2.5"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
