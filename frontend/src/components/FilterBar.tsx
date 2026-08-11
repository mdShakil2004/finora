import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ArrowUpDown, Calendar, DollarSign } from 'lucide-react';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { TransactionFilters } from '../types';

interface FilterBarProps {
  filters: TransactionFilters;
  setFilters: React.Dispatch<React.SetStateAction<TransactionFilters>>;
  categories: string[];
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  categories,
  onReset,
}) => {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, setFilters]);

  const activeFiltersCount = [
    filters.search,
    filters.category,
    filters.status,
    filters.minAmount,
    filters.maxAmount,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((cat) => ({ value: cat, label: cat })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'SUCCESS', label: 'Success' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'PENDING', label: 'Pending' },
  ];

  const sortOptions = [
    { value: 'date_desc', label: 'Newest First' },
    { value: 'date_asc', label: 'Oldest First' },
    { value: 'amount_desc', label: 'Highest Amount' },
    { value: 'amount_asc', label: 'Lowest Amount' },
  ];

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'date_desc') setFilters((p) => ({ ...p, sortBy: 'date', sortOrder: 'desc', page: 1 }));
    else if (val === 'date_asc') setFilters((p) => ({ ...p, sortBy: 'date', sortOrder: 'asc', page: 1 }));
    else if (val === 'amount_desc') setFilters((p) => ({ ...p, sortBy: 'amount', sortOrder: 'desc', page: 1 }));
    else if (val === 'amount_asc') setFilters((p) => ({ ...p, sortBy: 'amount', sortOrder: 'asc', page: 1 }));
  };

  const currentSortVal = `${filters.sortBy}_${filters.sortOrder}`;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs mb-6">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="flex-1 min-w-[240px]">
          <Input
            placeholder="Search by merchant or transaction ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Primary Filter Selects */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-36">
            <Select
              value={filters.category}
              onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value, page: 1 }))}
              options={categoryOptions}
            />
          </div>

          <div className="w-32">
            <Select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}
              options={statusOptions}
            />
          </div>

          <div className="w-36">
            <Select
              value={currentSortVal}
              onChange={handleSortChange}
              options={sortOptions}
            />
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 ${showAdvanced ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : ''}`}
          >
            <Filter className="w-4 h-4" />
            <span>More</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-indigo-600 text-white rounded-full font-bold">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setSearchInput('');
                onReset();
              }}
              className="text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filter Drawer Section */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fadeIn">
          <Input
            type="number"
            label="Min Amount (₹)"
            placeholder="e.g. 100"
            value={filters.minAmount}
            onChange={(e) => setFilters((p) => ({ ...p, minAmount: e.target.value, page: 1 }))}
            icon={<DollarSign className="w-3.5 h-3.5" />}
          />
          <Input
            type="number"
            label="Max Amount (₹)"
            placeholder="e.g. 5000"
            value={filters.maxAmount}
            onChange={(e) => setFilters((p) => ({ ...p, maxAmount: e.target.value, page: 1 }))}
            icon={<DollarSign className="w-3.5 h-3.5" />}
          />
          <Input
            type="date"
            label="Start Date"
            value={filters.startDate}
            onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value, page: 1 }))}
            icon={<Calendar className="w-3.5 h-3.5" />}
          />
          <Input
            type="date"
            label="End Date"
            value={filters.endDate}
            onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value, page: 1 }))}
            icon={<Calendar className="w-3.5 h-3.5" />}
          />
        </div>
      )}

      {/* Active Filter Badges display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-medium mr-1">Filters applied:</span>
          
          {filters.search && (
            <Badge variant="indigo" className="gap-1">
              Search: "{filters.search}"
              <X
                className="w-3 h-3 cursor-pointer hover:text-rose-600"
                onClick={() => {
                  setSearchInput('');
                  setFilters((p) => ({ ...p, search: '', page: 1 }));
                }}
              />
            </Badge>
          )}

          {filters.category && (
            <Badge variant="indigo" className="gap-1">
              Category: {filters.category}
              <X
                className="w-3 h-3 cursor-pointer hover:text-rose-600"
                onClick={() => setFilters((p) => ({ ...p, category: '', page: 1 }))}
              />
            </Badge>
          )}

          {filters.status && (
            <Badge variant="indigo" className="gap-1">
              Status: {filters.status}
              <X
                className="w-3 h-3 cursor-pointer hover:text-rose-600"
                onClick={() => setFilters((p) => ({ ...p, status: '', page: 1 }))}
              />
            </Badge>
          )}

          {filters.minAmount && (
            <Badge variant="indigo" className="gap-1">
              Min: ₹{filters.minAmount}
              <X
                className="w-3 h-3 cursor-pointer hover:text-rose-600"
                onClick={() => setFilters((p) => ({ ...p, minAmount: '', page: 1 }))}
              />
            </Badge>
          )}

          {filters.maxAmount && (
            <Badge variant="indigo" className="gap-1">
              Max: ₹{filters.maxAmount}
              <X
                className="w-3 h-3 cursor-pointer hover:text-rose-600"
                onClick={() => setFilters((p) => ({ ...p, maxAmount: '', page: 1 }))}
              />
            </Badge>
          )}

          {(filters.startDate || filters.endDate) && (
            <Badge variant="indigo" className="gap-1">
              Date: {filters.startDate || 'Any'} to {filters.endDate || 'Any'}
              <X
                className="w-3 h-3 cursor-pointer hover:text-rose-600"
                onClick={() => setFilters((p) => ({ ...p, startDate: '', endDate: '', page: 1 }))}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
