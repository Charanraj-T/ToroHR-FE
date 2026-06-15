import { Search, X } from 'lucide-react';
import { MONTH_NAMES, buildYearOptions, getCurrentYearMonth } from '../payrollHelpers';

export interface PayrollFilterValues {
  search: string;
  month: string;
  year: string;
  status: string;
}

interface PayrollFiltersProps {
  values: PayrollFilterValues;
  showStatusFilter?: boolean;
  onChange: (field: keyof PayrollFilterValues, value: string) => void;
  onClear: () => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Processed', label: 'Processed' },
  { value: 'Paid', label: 'Paid' }
];

const PayrollFilters = ({
  values,
  showStatusFilter = true,
  onChange,
  onClear
}: PayrollFiltersProps) => {
  const { month: defaultMonth, year: defaultYear } = getCurrentYearMonth();
  const hasFilters = values.search !== '' || values.status !== ''
    || values.month !== String(defaultMonth) || values.year !== String(defaultYear);
  const years = buildYearOptions();

  return (
    <div className="filter-card">
      <div className="filter-bar">
        <div className="filter-search">
          <Search size={18} className="filter-search-icon" />
          <input
            type="text"
            placeholder="Search by name or ID"
            value={values.search}
            onChange={(e) => onChange('search', e.target.value)}
          />
        </div>

        <div className="filter-select">
          <select value={values.month} onChange={(e) => onChange('month', e.target.value)}>
            <option value="">All Months</option>
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={String(index + 1)}>{name}</option>
            ))}
          </select>
        </div>

        <div className="filter-select">
          <select value={values.year} onChange={(e) => onChange('year', e.target.value)}>
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={String(year)}>{year}</option>
            ))}
          </select>
        </div>

        {showStatusFilter && (
          <div className="filter-select">
            <select value={values.status} onChange={(e) => onChange('status', e.target.value)}>
              {STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value || 'all'} value={value}>{label}</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          className="filter-clear-btn"
          onClick={onClear}
          disabled={!hasFilters}
          title="Clear filters"
          aria-label="Clear filters"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default PayrollFilters;
