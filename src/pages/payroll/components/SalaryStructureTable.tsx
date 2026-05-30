import { Edit2, Plus } from 'lucide-react';
import Table, { type Column } from '../../../components/ui/Table';
import type { SalaryStructure } from '../../../services/payroll.service';
import EmptyState from '../../claims/components/EmptyState';
import { formatMonthYear } from '../payrollHelpers';
import './SalaryStructureTable.css';

interface SalaryStructureTableProps {
  records: SalaryStructure[];
  loading: boolean;
  onEdit: (record: SalaryStructure) => void;
  onAdd: () => void;
}

const SalaryStructureTable = ({ records, loading, onEdit, onAdd }: SalaryStructureTableProps) => {
  const columns: Column<SalaryStructure>[] = [
    {
      header: 'EMPLOYEE',
      accessor: (item) => (
        <div className="salary-employee-cell">
          <div className="avatar-placeholder">
            {item.employee?.fullName?.substring(0, 2).toUpperCase() || 'EM'}
          </div>
          <div className="employee-info">
            <span className="employee-name">{item.employee?.fullName || 'N/A'}</span>
            <span className="employee-sub">{item.employee?.employeeId || '—'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'TYPE',
      accessor: (item) => <span>{item.employmentType}</span>
    },
    {
      header: 'EFFECTIVE MONTH',
      accessor: (item) => (
        <span>{formatMonthYear(item.effectiveMonth, item.effectiveYear)}</span>
      )
    },
    {
      header: 'GROSS / DAILY',
      accessor: (item) => (
        <span className="salary-amount">
          {item.employmentType === 'Full-time'
            ? `₹${(item.gross || 0).toLocaleString('en-IN')}`
            : `₹${(item.dailyAmount || 0).toLocaleString('en-IN')}/day`}
        </span>
      )
    },
    {
      header: 'ACTIONS',
      accessor: (item) => (
        <div className="table-actions">
          <button
            type="button"
            className="action-btn"
            title="Edit"
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
          >
            <Edit2 size={18} />
          </button>
        </div>
      )
    }
  ];

  if (!loading && records.length === 0) {
    return (
      <div className="salary-empty-wrap">
        <EmptyState
          title="No salary configured"
          message="Add salary structures for employees to enable payroll generation."
        />
        <button type="button" className="btn-primary" onClick={onAdd}>
          <Plus size={18} /> Add Salary Structure
        </button>
      </div>
    );
  }

  return <Table columns={columns} data={records} loading={loading} />;
};

export default SalaryStructureTable;
