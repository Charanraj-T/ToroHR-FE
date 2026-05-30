import {
  Eye,
  Download,
  Banknote,
  RefreshCw,
  Play
} from 'lucide-react';
import Table, { type Column } from '../../../components/ui/Table';
import StatusBadge from '../../../components/ui/StatusBadge';
import type { Payroll } from '../../../services/payroll.service';
import EmptyState from '../../claims/components/EmptyState';
import { formatCurrency, formatMonthYear, getNetPay } from '../payrollHelpers';
import './PayrollTable.css';

interface PayrollTableProps {
  records: Payroll[];
  loading: boolean;
  role: string;
  showEmployeeColumn?: boolean;
  onView: (record: Payroll) => void;
  onProcess?: (record: Payroll) => void;
  onMarkPaid?: (record: Payroll) => void;
  onRegenerate?: (record: Payroll) => void;
  onDownload?: (record: Payroll) => void;
  actionLoadingId?: string | null;
}

const PayrollTable = ({
  records,
  loading,
  role,
  showEmployeeColumn = true,
  onView,
  onProcess,
  onMarkPaid,
  onRegenerate,
  onDownload,
  actionLoadingId
}: PayrollTableProps) => {
  const columns: Column<Payroll>[] = [];

  if (showEmployeeColumn) {
    columns.push({
      header: 'EMPLOYEE',
      accessor: (item) => (
        <div className="payroll-employee-cell">
          <div className="avatar-placeholder">
            {item.employeeName?.substring(0, 2).toUpperCase() || 'EM'}
          </div>
          <div className="employee-info">
            <span className="employee-name">{item.employeeName}</span>
            <span className="employee-sub">{item.employeeCode}</span>
          </div>
        </div>
      )
    });
  }

  columns.push(
    {
      header: 'TYPE',
      accessor: (item) => <span className="payroll-type-badge">{item.employmentType}</span>
    },
    {
      header: 'MONTH',
      accessor: (item) => <span>{formatMonthYear(item.month, item.year)}</span>
    },
    {
      header: 'NET PAY',
      accessor: (item) => (
        <span className="payroll-net-pay">{formatCurrency(getNetPay(item))}</span>
      )
    },
    {
      header: 'STATUS',
      accessor: (item) => <StatusBadge status={item.status} />
    },
    {
      header: 'ACTIONS',
      accessor: (item) => {
        const isBusy = actionLoadingId === item.id;
        const isAdmin = role === 'Admin';

        return (
          <div className="table-actions">
            <button
              type="button"
              className="action-btn"
              title="View"
              disabled={isBusy}
              onClick={(e) => { e.stopPropagation(); onView(item); }}
            >
              <Eye size={18} />
            </button>

            {onDownload && (
              <button
                type="button"
                className="action-btn"
                title="Download PDF"
                disabled={isBusy}
                onClick={(e) => { e.stopPropagation(); onDownload(item); }}
              >
                <Download size={18} />
              </button>
            )}

            {isAdmin && item.status === 'Draft' && onProcess && (
              <button
                type="button"
                className="action-btn approve"
                title="Process"
                disabled={isBusy}
                onClick={(e) => { e.stopPropagation(); onProcess(item); }}
              >
                <Play size={18} />
              </button>
            )}

            {isAdmin && item.status === 'Processed' && onMarkPaid && (
              <button
                type="button"
                className="action-btn reimburse"
                title="Mark Paid"
                disabled={isBusy}
                onClick={(e) => { e.stopPropagation(); onMarkPaid(item); }}
              >
                <Banknote size={18} />
              </button>
            )}

            {isAdmin && item.status !== 'Paid' && onRegenerate && (
              <button
                type="button"
                className="action-btn"
                title="Regenerate"
                disabled={isBusy}
                onClick={(e) => { e.stopPropagation(); onRegenerate(item); }}
              >
                <RefreshCw size={18} />
              </button>
            )}
          </div>
        );
      }
    }
  );

  if (!loading && records.length === 0) {
    return (
      <EmptyState
        title="No payroll records"
        message="Try adjusting your filters or generate payroll for a month."
      />
    );
  }

  return (
    <Table
      columns={columns}
      data={records}
      loading={loading}
      onRowClick={onView}
    />
  );
};

export default PayrollTable;
