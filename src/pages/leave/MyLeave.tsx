import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit2, XCircle, Calendar } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Table, { type Column } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import { useToastStore } from '../../store/toastStore';
import leaveService, { type Leave, type LeaveBalance } from '../../services/leave.service';
import LeaveBalanceCard from './components/LeaveBalanceCard';
import LeaveForm from './components/LeaveForm';
import LeaveFilters from './components/LeaveFilters';
import HolidayViewModal from './components/HolidayViewModal';
import { getLeaveTypeDetails, formatDate } from './leaveHelpers';
import './MyLeave.css';

const PAGE_SIZE = 10;

const MyLeave = () => {
  const { addToast } = useToastStore();

  const [balances, setBalances] = useState<LeaveBalance | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const searchRef = useRef('');
  const [searchVersion, setSearchVersion] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [leaveType, setLeaveType] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null);
  const [cancelLeaveId, setCancelLeaveId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isHolidayViewOpen, setIsHolidayViewOpen] = useState(false);
  const cancelSubmittedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchLeaves = useCallback(async (p: number) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, limit: PAGE_SIZE };
      if (searchRef.current.trim()) params.search = searchRef.current.trim();
      if (leaveType) params.leaveType = leaveType;
      if (status) params.status = status;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await leaveService.getMyLeaves(params);
      if (controller.signal.aborted) return;
      setLeaves(res.data || []);
      setTotalItems(res.total || 0);
      setTotalPages(res.totalPages > 0 ? res.totalPages : 1);
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return;
      addToast('Failed to load leaves', 'error');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [leaveType, status, startDate, endDate, addToast]);

  const fetchBalances = async () => {
    try {
      const data = await leaveService.getMyLeaveBalance();
      setBalances(data);
    } catch {
      addToast('Failed to load leave balance', 'error');
    }
  };

  useEffect(() => {
    fetchLeaves(currentPage);
  }, [currentPage, fetchLeaves, searchVersion]);

  useEffect(() => {
    fetchBalances();
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const commitSearch = (value: string) => {
    searchRef.current = value;
    setCurrentPage(1);
    setSearchVersion(v => v + 1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commitSearch(value), 400);
  };

  const clearFilters = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearch('');
    searchRef.current = '';
    setLeaveType('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const openApplyModal = () => {
    setEditingLeave(null);
    setIsApplyOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, item: Leave) => {
    e.stopPropagation();
    setEditingLeave(item);
    setIsApplyOpen(true);
  };

  const handleOpenCancelConfirm = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCancelLeaveId(id);
    setCancelReason('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelLeaveId) return;
    if (cancelSubmittedRef.current) return;
    cancelSubmittedRef.current = true;
    try {
      await leaveService.cancelLeave(cancelLeaveId, {
        cancellationReason: cancelReason.trim() || 'Cancelled by employee'
      });
      addToast('Leave request cancelled successfully', 'success');
      setCancelLeaveId(null);
      cancelSubmittedRef.current = false;
      fetchLeaves(currentPage);
      fetchBalances();
    } catch {
      addToast('Failed to cancel leave request', 'error');
      cancelSubmittedRef.current = false;
    }
  };

  const columns: Column<Leave>[] = [
    {
      header: 'LEAVE TYPE',
      accessor: (item: Leave) => {
        const detail = getLeaveTypeDetails(item.leaveType);
        return (
          <div className="leave-type-cell">
            <span className="type-dot" style={{ backgroundColor: detail.color }}></span>
            <span className="type-name">{detail.name}</span>
          </div>
        );
      }
    },
    {
      header: 'DURATION',
      accessor: (item: Leave) => (
        <span className="duration-cell">
          {formatDate(item.fromDate)} - {formatDate(item.toDate)}
          <span className="days-badge">({item.leaveDays} {item.leaveDays === 1 ? 'day' : 'days'})</span>
        </span>
      )
    },
    {
      header: 'DATE APPLIED',
      accessor: (item: Leave) => <span>{formatDate(item.createdAt)}</span>
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
            <button
              className="action-btn"
              onClick={(e) => openEditModal(e, item)}
              title="Edit Leave"
            >
              <Edit2 size={18} />
            </button>
          )}
          {(item.status === 'Pending' || item.status === 'Approved') && (
            <button
              className="action-btn deactivate"
              onClick={(e) => handleOpenCancelConfirm(e, item.id)}
              title="Cancel Leave"
            >
              <XCircle size={18} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="my-leave-page animate-fade-in">
      <PageHeader
        title="Leave Overview"
        subtitle="Manage your leave balances and track your time off."
        actions={
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="btn-secondary" onClick={() => setIsHolidayViewOpen(true)}>
              <Calendar size={18} /> View Holidays
            </button>
            <button className="btn-primary" onClick={openApplyModal}>
              <Plus size={18} /> Apply Leave
            </button>
          </div>
        }
      />

      <div className="leave-balances-grid">
          <LeaveBalanceCard type="CL" balance={balances?.CL} />
          <LeaveBalanceCard type="SL" balance={balances?.SL} />
          <LeaveBalanceCard type="PL" balance={balances?.PL} />
          <LeaveBalanceCard type="LOP" balance={balances?.LOP} />
      </div>

      <LeaveFilters
        search={search}
        leaveType={leaveType}
        status={status}
        startDate={startDate}
        endDate={endDate}
        onSearchChange={handleSearchChange}
        onLeaveTypeChange={(v) => { setLeaveType(v); setCurrentPage(1); }}
        onStatusChange={(v) => { setStatus(v); setCurrentPage(1); }}
        onStartDateChange={(v) => { setStartDate(v); setCurrentPage(1); }}
        onEndDateChange={(v) => { setEndDate(v); setCurrentPage(1); }}
        onClear={clearFilters}
      />

      <div className="history-table-card">
        <div className="history-table-header">
          <span className="history-count-badge">
            {totalItems} {totalItems === 1 ? 'record' : 'records'}
          </span>
        </div>
        <Table
          columns={columns}
          data={leaves}
          loading={loading}
        />
        <div className="history-pagination-wrapper">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={PAGE_SIZE}
            onPageChange={(page) => { setCurrentPage(page); }}
          />
        </div>
      </div>

      <Modal
        isOpen={isApplyOpen}
        onClose={() => {
          setIsApplyOpen(false);
          setEditingLeave(null);
        }}
        title={editingLeave ? 'Edit Leave' : 'Apply Leave'}
      >
        <LeaveForm
          balances={balances}
          initialLeave={editingLeave}
          onSubmitSuccess={() => {
            setIsApplyOpen(false);
            setEditingLeave(null);
            fetchLeaves(currentPage);
            fetchBalances();
          }}
          onCancel={() => {
            setIsApplyOpen(false);
            setEditingLeave(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={cancelLeaveId !== null}
        onClose={() => setCancelLeaveId(null)}
        title="Cancel Leave Request"
        footer={
          <div className="modal-footer-btns">
            <button className="btn-secondary" onClick={() => setCancelLeaveId(null)}>
              Go Back
            </button>
            <button className="btn-primary btn-danger-action" onClick={handleConfirmCancel}>
              Confirm Cancellation
            </button>
          </div>
        }
      >
        <div className="cancel-confirm-body">
          <p>Are you sure you want to cancel this leave request? If approved, the leave balance will be reverted.</p>
          <div className="form-group" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label">Cancellation Reason (Optional)</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="E.g., Plan changed, rescheduled..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
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

export default MyLeave;
