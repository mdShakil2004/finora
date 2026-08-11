import React from 'react';
import { Drawer } from './ui/Drawer';
import { Badge } from './ui/Badge';
import { Transaction } from '../types';
import { formatCurrency, formatDateTime } from '../lib/formatters';
import { ShoppingBag, CreditCard, Calendar, Hash, Tag, Building2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface TransactionDetailDrawerProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  if (!transaction) return null;

  const statusVariantMap = {
    SUCCESS: 'success',
    FAILED: 'failed',
    PENDING: 'pending',
  } as const;

  const statusIconMap = {
    SUCCESS: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    FAILED: <AlertCircle className="w-4 h-4 text-rose-600" />,
    PENDING: <Clock className="w-4 h-4 text-amber-600" />,
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Transaction Details">
      <div className="space-y-6">
        {/* Header Amount Card */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-center">
          <p className="text-xs uppercase font-semibold tracking-wider text-slate-500">Transaction Amount</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(transaction.amount, transaction.currency)}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {statusIconMap[transaction.status]}
            <Badge variant={statusVariantMap[transaction.status]}>
              {transaction.status}
            </Badge>
          </div>
        </div>

        {/* Primary Metadata List */}
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <Building2 className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-500">Merchant Name</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{transaction.merchant}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <Tag className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-500">Category</p>
              <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded-md text-xs font-medium">
                {transaction.category}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <Calendar className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-500">Date & Time</p>
              <p className="text-sm font-medium text-slate-900 mt-0.5">
                {formatDateTime(transaction.timestamp)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <CreditCard className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-500">Payment Method</p>
              <p className="text-sm font-medium text-slate-900 mt-0.5 capitalize">
                {transaction.payment_method.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <Hash className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
            <div className="w-full overflow-hidden">
              <p className="text-xs font-medium text-slate-500">Transaction ID</p>
              <p className="text-xs font-mono bg-slate-100 text-slate-700 p-2 rounded-md mt-1 break-all">
                {transaction.id}
              </p>
            </div>
          </div>
        </div>

        {/* Footer info note */}
        <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-900">
          <p className="font-semibold mb-1">Earn Rewards</p>
          <p className="text-indigo-700 leading-relaxed">
            Every successful payment earns Finora coins automatically credited to your wallet balance.
          </p>
        </div>
      </div>
    </Drawer>
  );
};
