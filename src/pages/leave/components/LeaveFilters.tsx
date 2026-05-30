import { Search, Filter, X } from 'lucide-react';

interface LeaveFiltersProps {
  search: string;
  leaveType: string;
  status: string;
  startDate: string;
  endDate: string;
  onSearchChange: (value: string) => void;
  onLeaveTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClear: () => void;
}

const LEAVE_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'CL', label: 'Casual Leave' },
  { value: 'SL', label: 'Sick Leave' },
  { value: 'PL', label: 'Paid Leave' },
  { value: 'LOP', label: 'Loss Of Pay' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const LeaveFilters = ({
  search, leaveType, status, startDate, endDate,
  onSearchChange, onLeaveTypeChange, onStatusChange,
  onStartDateChange, onEndDateChange,
  onClear,
}: LeaveFiltersProps) => {
  const hasFilters = search || leaveType || status || startDate || endDate;

  return (
    <div className="filter-card">
      <div className="filter-bar">
        <div className="filter-search">
          <Search size={18} className="filter-search-icon" />
          <input
            type="text"
            placeholder="Search by reason..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="filter-select has-icon">
          <Filter size={14} className="filter-select-icon" />
          <select
            value={leaveType}
            onChange={(e) => onLeaveTypeChange(e.target.value)}
          >
            {LEAVE_TYPE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="filter-select">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="filter-date-range">
          <div className="filter-date">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              title="Start Date"
            />
          </div>
          <span className="filter-date-sep">to</span>
          <div className="filter-date">
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              title="End Date"
            />
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
};

export default LeaveFilters;
