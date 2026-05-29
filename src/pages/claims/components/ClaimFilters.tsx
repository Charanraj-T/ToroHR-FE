import React from 'react';
import { Filter, Calendar, X } from 'lucide-react';
import type { Employee } from '../../../services/employee.service';
import './ClaimFilters.css';

export interface ClaimFilterValues {
  employee: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

interface ClaimFiltersProps {
  values: ClaimFilterValues;
  showEmployeeFilter: boolean;
  employees: Employee[];
  employeesLoading?: boolean;
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
  showEmployeeFilter,
  employees,
  employeesLoading,
  onChange,
  onClear
}: ClaimFiltersProps) => {
  const hasFilters = values.employee || values.status || values.dateFrom || values.dateTo;

  return (
    <div className="claim-filters-card">
      <div className="claim-filters-form">
        {showEmployeeFilter && (
          <div className="cf-select-wrapper">
            <Filter size={14} className="cf-icon" />
            <select
              value={values.employee}
              onChange={(e) => onChange('employee', e.target.value)}
              disabled={employeesLoading}
            >
              <option value="">All Employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName} ({employee.employeeId})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="cf-select-wrapper">
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

        <div className="cf-date-range">
          <div className="cf-date-wrapper">
            <input
              type="date"
              value={values.dateFrom}
              onChange={(e) => onChange('dateFrom', e.target.value)}
              title="From date"
            />
            <Calendar size={14} className="cf-cal-icon" />
          </div>
          <span className="cf-date-sep">to</span>
          <div className="cf-date-wrapper">
            <input
              type="date"
              value={values.dateTo}
              onChange={(e) => onChange('dateTo', e.target.value)}
              title="To date"
            />
            <Calendar size={14} className="cf-cal-icon" />
          </div>
        </div>

        <button
          type="button"
          className="cf-clear-btn"
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
