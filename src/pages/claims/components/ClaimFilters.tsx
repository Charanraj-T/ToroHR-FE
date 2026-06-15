import React from 'react';
import { Search, Calendar, X } from 'lucide-react';
import './ClaimFilters.css';

export interface ClaimFilterValues {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

interface ClaimFiltersProps {
  values: ClaimFilterValues;
  onChange: (field: keyof ClaimFilterValues, value: string) => void;
  onClear: () => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Reimbursed', label: 'Reimbursed' }
];

const ClaimFilters = React.memo(({
  values,
  onChange,
  onClear
}: ClaimFiltersProps) => {
  const hasFilters = values.search || values.status || values.dateFrom || values.dateTo;

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
          <select
            value={values.status}
            onChange={(e) => onChange('status', e.target.value)}
          >
            {STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-date-range">
          <div className="filter-date">
            <input
              type="date"
              value={values.dateFrom}
              onChange={(e) => onChange('dateFrom', e.target.value)}
              title="From date"
            />
            <Calendar size={14} className="filter-date-sep" style={{ position: 'absolute', right: '10px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>
          <span className="filter-date-sep">to</span>
          <div className="filter-date">
            <input
              type="date"
              value={values.dateTo}
              onChange={(e) => onChange('dateTo', e.target.value)}
              title="To date"
            />
            <Calendar size={14} className="filter-date-sep" style={{ position: 'absolute', right: '10px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>
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
});

export default ClaimFilters;
