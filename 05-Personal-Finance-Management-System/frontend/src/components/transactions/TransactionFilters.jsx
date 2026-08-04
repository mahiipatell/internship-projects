import { Search } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';

function TransactionFilters({ filters, onChange, categories }) {
  const update = (key, value) => onChange({ ...filters, [key]: value, page: 1 });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
      <div className="relative lg:col-span-2">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-olive-600/50" />
        <input
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          placeholder="Search transactions..."
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900
            pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <Select value={filters.type} onChange={(e) => update('type', e.target.value)}>
        <option value="">All Types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </Select>

      <Select value={filters.categoryId} onChange={(e) => update('categoryId', e.target.value)}>
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Select
        value={`${filters.sortBy}:${filters.sortOrder}`}
        onChange={(e) => {
          const [sortBy, sortOrder] = e.target.value.split(':');
          onChange({ ...filters, sortBy, sortOrder });
        }}
      >
        <option value="date:desc">Newest first</option>
        <option value="date:asc">Oldest first</option>
        <option value="amount:desc">Amount: High to Low</option>
        <option value="amount:asc">Amount: Low to High</option>
      </Select>
    </div>
  );
}

export default TransactionFilters;
