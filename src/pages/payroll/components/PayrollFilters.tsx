import { X } from 'lucide-react';
import type { Employee } from '../../../services/employee.service';
import { MONTH_NAMES, buildYearOptions } from '../payrollHelpers';
import './PayrollFilters.css';

export interface PayrollFilterValues {
  month: string;
  year: string;
  employee: string;
  status: string;
}

interface PayrollFiltersProps {
  values: PayrollFilterValues;
  showEmployeeFilter?: boolean;
  showStatusFilter?: boolean;
  employees?: Employee[];
  employeesLoading?: boolean;
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
  showEmployeeFilter = true,
  showStatusFilter = true,
  employees = [],
  employeesLoading,
  onChange,
  onClear
}: PayrollFiltersProps) => {
  const hasFilters = values.month || values.year || values.employee || values.status;
  const years = buildYearOptions();

  return (
    <div className="payroll-filters-card">
      <div className="payroll-filters-form">
        <div className="pf-select-wrapper">
          <select value={values.month} onChange={(e) => onChange('month', e.target.value)}>
            <option value="">All Months</option>
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={String(index + 1)}>{name}</option>
            ))}
          </select>
        </div>

        <div className="pf-select-wrapper">
          <select value={values.year} onChange={(e) => onChange('year', e.target.value)}>
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={String(year)}>{year}</option>
            ))}
          </select>
        </div>

        {showEmployeeFilter && (
          <div className="pf-select-wrapper pf-employee-wrapper">
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

        {showStatusFilter && (
          <div className="pf-select-wrapper">
            <select value={values.status} onChange={(e) => onChange('status', e.target.value)}>
              {STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value || 'all'} value={value}>{label}</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          className="pf-clear-btn"
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
