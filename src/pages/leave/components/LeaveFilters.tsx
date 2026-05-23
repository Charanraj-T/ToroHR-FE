import { Search, Filter, Calendar, X } from 'lucide-react';
import './LeaveFilters.css';

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
    <div className="leave-filters-card">
      <div className="leave-filters-form">
        <div className="lf-search-wrapper">
          <Search size={18} className="lf-search-icon" />
          <input
            type="text"
            className="lf-search-input"
            placeholder="Search by reason..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="lf-select-wrapper">
          <Filter size={14} className="lf-icon" />
          <select
            value={leaveType}
            onChange={(e) => onLeaveTypeChange(e.target.value)}
          >
            {LEAVE_TYPE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="lf-select-wrapper">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="lf-date-range">
          <div className="lf-date-wrapper">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              title="Start Date"
            />
            <Calendar size={14} className="lf-cal-icon" />
          </div>
          <span className="lf-date-sep">to</span>
          <div className="lf-date-wrapper">
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              title="End Date"
            />
            <Calendar size={14} className="lf-cal-icon" />
          </div>
        </div>

        <button
          type="button"
          className="lf-clear-btn"
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
