import { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import Table, { type Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { useToastStore } from '../../store/toastStore';
import leaveService, { type Leave, type LeaveFilters as LeaveFilterParams } from '../../services/leave.service';
import LeaveFilters from './components/LeaveFilters';
import { getLeaveTypeDetails, formatDate } from './leaveHelpers';
import './TeamLeaveManagement.css';

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
  const limit = 10;
  
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0
  });

  const [rejectLeaveId, setRejectLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const filters: LeaveFilterParams = {
        page,
        limit,
        search: searchRef.current.trim() || undefined,
        leaveType: leaveType || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      
      const response = await leaveService.getLeaves(filters);
      setLeaves(response.data || []);
      setPagination({
        totalPages: response.totalPages || 1,
        totalItems: response.total || 0
      });
    } catch (error) {
      console.error('Failed to fetch team leaves:', error);
    } finally {
      setLoading(false);
    }
  };

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
  }, [page, leaveType, status, startDate, endDate, searchVersion]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleApprove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      await leaveService.approveLeave(id);
      addToast('Leave request approved successfully', 'success');
      fetchLeaves();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Failed to approve leave request';
      addToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectModal = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRejectLeaveId(id);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectLeaveId || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      await leaveService.rejectLeave(rejectLeaveId, { 
        rejectionReason: rejectionReason.trim() 
      });
      addToast('Leave request rejected successfully', 'success');
      setRejectLeaveId(null);
      fetchLeaves();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Failed to reject leave request';
      addToast(msg, 'error');
    } finally {
      setActionLoading(false);
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
        return <span className="type-badge" style={{ borderLeft: `3px solid ${detail.color}`, paddingLeft: '8px', fontWeight: 500 }}>{detail.name}</span>;
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

      <div className="table-card-container">
        <Table 
          columns={columns}
          data={leaves}
          loading={loading}
        />
        <Pagination 
          currentPage={page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={limit}
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
    </div>
  );
};

export default TeamLeaveManagement;
