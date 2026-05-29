import { useMemo } from 'react';
import {
  Eye,
  Edit2,
  XCircle,
  Check,
  X,
  Banknote,
  Paperclip,
  Trash2
} from 'lucide-react';
import Table, { type Column } from '../../../components/ui/Table';
import StatusBadge from '../../../components/ui/StatusBadge';
import type { Claim } from '../../../services/claim.service';
import {
  formatClaimAmount,
  formatClaimDate,
  getAttachmentCountLabel,
  getClaimActions
} from '../claimHelpers';
import EmptyState from './EmptyState';
import './ClaimTable.css';

interface ClaimTableProps {
  claims: Claim[];
  loading: boolean;
  role: string;
  employeeId?: string;
  showEmployeeColumn?: boolean;
  onView: (claim: Claim) => void;
  onEdit?: (claim: Claim) => void;
  onCancel?: (claim: Claim) => void;
  onDelete?: (claim: Claim) => void;
  onApprove?: (claim: Claim) => void;
  onReject?: (claim: Claim) => void;
  onReimburse?: (claim: Claim) => void;
  actionLoadingId?: string | null;
}

const ClaimTable = ({
  claims,
  loading,
  role,
  employeeId,
  showEmployeeColumn = true,
  onView,
  onEdit,
  onCancel,
  onDelete,
  onApprove,
  onReject,
  onReimburse,
  actionLoadingId
}: ClaimTableProps) => {
  const columns: Column<Claim>[] = useMemo(() => {
    const cols: Column<Claim>[] = [
      {
        header: 'CLAIM NAME',
        accessor: (item) => <span className="claim-name-cell">{item.name}</span>
      }
    ];

    if (showEmployeeColumn) {
      cols.push({
        header: 'EMPLOYEE',
        accessor: (item) => (
          <div className="claim-employee-cell">
            <div className="avatar-placeholder">
              {item.employee?.fullName?.substring(0, 2).toUpperCase() || 'EM'}
            </div>
            <div className="employee-info">
              <span className="employee-name">{item.employee?.fullName || 'N/A'}</span>
              <span className="employee-sub">
                {item.employee?.department || 'N/A'} • {item.employee?.designation || 'N/A'}
              </span>
            </div>
          </div>
        )
      });
    }

    cols.push(
      {
        header: 'EXPENSE DATE',
        accessor: (item) => <span>{formatClaimDate(item.expenseDate)}</span>
      },
      {
        header: 'AMOUNT',
        accessor: (item) => <span className="claim-amount-cell">{formatClaimAmount(item.amount)}</span>
      },
      {
        header: 'STATUS',
        accessor: (item) => <StatusBadge status={item.status} />
      },
      {
        header: 'ATTACHMENTS',
        accessor: (item) => (
          <button
            type="button"
            className="claim-attachment-link"
            onClick={(e) => {
              e.stopPropagation();
              onView(item);
            }}
          >
            <Paperclip size={14} />
            {item.attachments?.length
              ? getAttachmentCountLabel(item.attachments.length)
              : 'No files'}
          </button>
        )
      },
      {
        header: 'ACTIONS',
        accessor: (item) => {
          const actions = getClaimActions(item, role, employeeId);
          const isBusy = actionLoadingId === item.id;

          return (
            <div className="table-actions">
                <button
                  type="button"
                  className="action-btn"
                  title="View"
                  disabled={isBusy}
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(item);
                  }}
                >
                  <Eye size={18} />
                </button>
              {actions.canEdit && onEdit && (
                <button
                  type="button"
                  className="action-btn"
                  title="Edit"
                  disabled={isBusy}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                >
                  <Edit2 size={18} />
                </button>
              )}
              {actions.canApprove && onApprove && (
                <button
                  type="button"
                  className="action-btn approve"
                  title="Approve"
                  disabled={isBusy}
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove(item);
                  }}
                >
                  <Check size={18} />
                </button>
              )}
              {actions.canReject && onReject && (
                <button
                  type="button"
                  className="action-btn reject"
                  title="Reject"
                  disabled={isBusy}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject(item);
                  }}
                >
                  <X size={18} />
                </button>
              )}
              {actions.canReimburse && onReimburse && (
                <button
                  type="button"
                  className="action-btn reimburse"
                  title="Mark Reimbursed"
                  disabled={isBusy}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReimburse(item);
                  }}
                >
                  <Banknote size={18} />
                </button>
              )}
              {actions.canCancel && onCancel && (
                <button
                  type="button"
                  className="action-btn deactivate"
                  title="Cancel"
                  disabled={isBusy}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(item);
                  }}
                >
                  <XCircle size={18} />
                </button>
              )}
              {actions.canDelete && onDelete && (
                <button
                  type="button"
                  className="action-btn delete"
                  title="Delete"
                  disabled={isBusy}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          );
        }
      }
    );

    return cols;
  }, [showEmployeeColumn, role, employeeId, actionLoadingId, onView, onEdit, onApprove, onReject, onReimburse, onCancel, onDelete]);

  if (!loading && claims.length === 0) {
    return <EmptyState title="No claims found" message="Try adjusting your filters or create a new claim." />;
  }

  return (
    <Table
      columns={columns}
      data={claims}
      loading={loading}
      onRowClick={onView}
    />
  );
};

export default ClaimTable;
