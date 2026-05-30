import { Search, X } from 'lucide-react';

interface HolidayFiltersProps {
  search: string;
  year: string;
  onSearchChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onClear: () => void;
}

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: '', label: 'All Years' },
  ...Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 2 + i;
    return { value: String(y), label: String(y) };
  }),
];

const HolidayFilters = ({
  search, year,
  onSearchChange, onYearChange,
  onClear,
}: HolidayFiltersProps) => {
  const hasFilters = search || year;

  return (
    <div className="filter-card">
      <div className="filter-bar">
        <div className="filter-search">
          <Search size={18} className="filter-search-icon" />
          <input
            type="text"
            placeholder="Search by holiday name..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="filter-select">
          <select value={year} onChange={(e) => onYearChange(e.target.value)}>
            {YEAR_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

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

export default HolidayFilters;
