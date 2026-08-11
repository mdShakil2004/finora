import React from 'react';
import { Card } from './ui/Card';
import { CategorySpending, MonthlySpending } from '../types';
import { formatCurrency, formatMonthName } from '../lib/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PieChart as PieIcon, TrendingUp } from 'lucide-react';

interface AnalyticsSectionProps {
  categoryData: CategorySpending[];
  monthlyData: MonthlySpending[];
  onSelectCategory: (category: string) => void;
  isLoading: boolean;
}

const COLORS = [
  '#4f46e5', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#64748b', // Slate
];

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  categoryData,
  monthlyData,
  onSelectCategory,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="h-80 animate-pulse bg-slate-100" />
        <Card className="h-80 animate-pulse bg-slate-100" />
      </div>
    );
  }

  const formattedMonthlyData = monthlyData.map((d) => ({
    ...d,
    formattedMonth: formatMonthName(d.month),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Category Breakdown (Donut Chart) */}
      <Card className="flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-base">Spending by Category</h3>
          </div>
          <span className="text-xs text-slate-500">Click segment to filter</span>
        </div>

        <div className="flex-1 flex flex-col md:flex-row items-center min-h-[240px]">
          <div className="w-full md:w-1/2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="amount"
                  nameKey="category"
                  onClick={(entry: any) => entry && entry.category && onSelectCategory(entry.category)}
                  className="cursor-pointer focus:outline-none"
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="transition-opacity duration-200 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Spent']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#38bdf8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Category Legend */}
          <div className="w-full md:w-1/2 flex flex-col gap-2 mt-4 md:mt-0 max-h-52 overflow-y-auto pr-2">
            {categoryData.map((cat, idx) => (
              <button
                key={cat.category}
                onClick={() => onSelectCategory(cat.category)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-xs font-medium text-slate-700 group-hover:text-indigo-600">
                    {cat.category}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 block">
                    {formatCurrency(cat.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {cat.transaction_count} txns
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Monthly Trend (Bar Chart) */}
      <Card className="flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-base">Monthly Spending Trend</h3>
          </div>
          <span className="text-xs text-slate-500">Last 12 months</span>
        </div>

        <div className="flex-1 h-56 min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="formattedMonth" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Total Spent']}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
