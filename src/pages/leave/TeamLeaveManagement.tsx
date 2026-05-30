import { useState, useEffect, useRef, useCallback } from 'react';
import { Check, X, Calendar } from 'lucide-react';
import Table, { type Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { useToastStore } from '../../store/toastStore';
import leaveService, { type Leave, type LeaveFilters as LeaveFilterParams } from '../../services/leave.service';
import LeaveFilters from './components/LeaveFilters';
import HolidayViewModal from './components/HolidayViewModal';
import PageHeader from '../../components/ui/PageHeader';
import { getLeaveTypeDetails, formatDate } from './leaveHelpers';
import './TeamLeaveManagement.css';

const PAGE_LIMIT = 10;

const TeamLeaveManagement = () => {
  const { addToast } = useToastStore();
  
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [search, setSearch] = useState<string>('');
  const searchRef = useRef('');
  const [searchVersion, setSearchVersion] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [leaveType, setLeaveType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0
  });

  const [rejectLeaveId, setRejectLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isHolidayViewOpen, setIsHolidayViewOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const actionSubmittedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchLeaves = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const filters: LeaveFilterParams = {
        page,
        limit: PAGE_LIMIT,
        search: searchRef.current.trim() || undefined,
        leaveType: leaveType || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      
      const response = await leaveService.getLeaves(filters);
      if (controller.signal.aborted) return;
      setLeaves(response.data || []);
      setPagination({
        totalPages: response.totalPages > 0 ? response.totalPages : 1,
        totalItems: response.total || 0
      });
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [page, leaveType, status, startDate, endDate]);

  const commitSearch = (value: string) => {
    searchRef.current = value;
    setPage(1);
    setSearchVersion(v => v + 1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commitSearch(value), 400);
  };

  const handleClearFilters = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearch('');
    searchRef.current = '';
    setLeaveType('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves, searchVersion]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleApprove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (actionSubmittedRef.current) return;
    actionSubmittedRef.current = true;
    setActionLoading(true);
    try {
      await leaveService.approveLeave(id);
      addToast('Leave request approved successfully', 'success');
      fetchLeaves();
    } catch {
      addToast('Failed to approve leave request', 'error');
    } finally {
      setActionLoading(false);
      actionSubmittedRef.current = false;
    }
  };

  const handleOpenRejectModal = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRejectLeaveId(id);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectLeaveId || !rejectionReason.trim()) return;
    if (actionSubmittedRef.current) return;
    actionSubmittedRef.current = true;
    setActionLoading(true);
    try {
      await leaveService.rejectLeave(rejectLeaveId, { 
        rejectionReason: rejectionReason.trim() 
      });
      addToast('Leave request rejected successfully', 'success');
      setRejectLeaveId(null);
      fetchLeaves();
    } catch {
      addToast('Failed to reject leave request', 'error');
    } finally {
      setActionLoading(false);
      actionSubmittedRef.current = false;
    }
  };

  const columns: Column<Leave>[] = [
    {
      header: 'EMPLOYEE',
      accessor: (item: Leave) => (
        <div className="employee-cell">
          <div className="avatar-placeholder">
            {item.employee?.fullName?.substring(0, 2).toUpperCase() || 'EM'}
          </div>
          <div className="employee-info">
            <span className="employee-name">{item.employee?.fullName || 'N/A'}</span>
            <span className="employee-sub">{item.employee?.department || 'N/A'} • {item.employee?.designation || 'N/A'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'LEAVE TYPE',
      accessor: (item: Leave) => {
        const detail = getLeaveTypeDetails(item.leaveType);
        return <span style={{ borderLeft: `3px solid ${detail.color}`, paddingLeft: '8px', fontWeight: 500 }}>{detail.name}</span>;
      }
    },
    {
      header: 'DURATION',
      accessor: (item: Leave) => (
        <div className="duration-cell-group">
          <span className="dates">{formatDate(item.fromDate)} - {formatDate(item.toDate)}</span>
          <span className="days">({item.leaveDays} {item.leaveDays === 1 ? 'day' : 'days'})</span>
        </div>
      )
    },
    {
      header: 'REASON',
      accessor: (item: Leave) => (
        <span className="reason-cell" title={item.reason}>
          {item.reason ? (item.reason.length > 40 ? `${item.reason.substring(0, 40)}...` : item.reason) : '-'}
        </span>
      )
    },
    {
      header: 'STATUS',
      accessor: (item: Leave) => <StatusBadge status={item.status} />
    },
    {
      header: 'ACTIONS',
      accessor: (item: Leave) => (
        <div className="table-actions">
          {item.status === 'Pending' && (
            <>
              <button 
                className="action-btn approve" 
                onClick={(e) => handleApprove(e, item.id)}
                title="Approve Leave"
                disabled={actionLoading}
              >
                <Check size={18} />
              </button>
              <button 
                className="action-btn reject" 
                onClick={(e) => handleOpenRejectModal(e, item.id)}
                title="Reject Leave"
                disabled={actionLoading}
              >
                <X size={18} />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="team-leaves-page animate-fade-in">
      <PageHeader
        title="Team Leave Overview"
        subtitle="Manage and review all leave requests across your team."
        actions={
          <button className="btn-secondary" onClick={() => setIsHolidayViewOpen(true)}>
            <Calendar size={18} /> View Holidays
          </button>
        }
      />

      <LeaveFilters
        search={search}
        leaveType={leaveType}
        status={status}
        startDate={startDate}
        endDate={endDate}
        onSearchChange={handleSearchChange}
        onLeaveTypeChange={(v) => { setLeaveType(v); setPage(1); }}
        onStatusChange={(v) => { setStatus(v); setPage(1); }}
        onStartDateChange={(v) => { setStartDate(v); setPage(1); }}
        onEndDateChange={(v) => { setEndDate(v); setPage(1); }}
        onClear={handleClearFilters}
      />

      <div className="table-card">
        <Table 
          columns={columns}
          data={leaves}
          loading={loading}
        />
        <Pagination 
          currentPage={page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={PAGE_LIMIT}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      <Modal
        isOpen={rejectLeaveId !== null}
        onClose={() => setRejectLeaveId(null)}
        title="Reject Leave Request"
        footer={
          <div className="modal-footer-btns">
            <button className="btn-secondary" onClick={() => setRejectLeaveId(null)}>
              Cancel
            </button>
            <button 
              className="btn-primary btn-danger-action" 
              onClick={handleConfirmReject}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              Confirm Reject
            </button>
          </div>
        }
      >
        <div className="reject-confirm-body">
          <p>Please enter the reason for rejecting this leave request. The employee will see this reason in their log.</p>
          <div className="form-group" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label">Rejection Reason</label>
            <textarea 
              className="form-textarea"
              rows={3}
              placeholder="E.g., Business priorities, coverage issues, etc..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          </div>
        </div>
      </Modal>

      <HolidayViewModal
        isOpen={isHolidayViewOpen}
        onClose={() => setIsHolidayViewOpen(false)}
      />
    </div>
  );
};

export default TeamLeaveManagement;
