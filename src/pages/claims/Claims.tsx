import { useCallback, useEffect, useState } from 'react';
import { Plus, Clock, CheckCircle2, XCircle, Banknote, Trash2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import claimService, { type Claim, type ClaimSummary } from '../../services/claim.service';
import employeeService, { type Employee } from '../../services/employee.service';
import ClaimSummaryCard from './components/ClaimSummaryCard';
import ClaimFilters, { type ClaimFilterValues } from './components/ClaimFilters';
import ClaimTable from './components/ClaimTable';
import ClaimFormModal from './components/ClaimFormModal';
import ClaimDetailsModal from './components/ClaimDetailsModal';
import LoadingSkeleton from './components/LoadingSkeleton';
import './Claims.css';

const PAGE_SIZE = 10;

const EMPTY_FILTERS: ClaimFilterValues = {
  employee: '',
  status: '',
  dateFrom: '',
  dateTo: ''
};

const EMPTY_SUMMARY: ClaimSummary = {
  Pending: 0,
  Approved: 0,
  Rejected: 0,
  Reimbursed: 0
};

const Claims = () => {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const role = user?.role || 'Employee';
  const canCreateClaim = role === 'Employee' || role === 'Manager';
  const showEmployeeFilter = role === 'Admin' || role === 'Manager';

  const [claims, setClaims] = useState<Claim[]>([]);
  const [summary, setSummary] = useState<ClaimSummary>(EMPTY_SUMMARY);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<ClaimFilterValues>(EMPTY_FILTERS);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [detailsClaimId, setDetailsClaimId] = useState<string | null>(null);
  const [cancelClaim, setCancelClaim] = useState<Claim | null>(null);
  const [deleteClaim, setDeleteClaim] = useState<Claim | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const buildQueryParams = useCallback(
    (filters: ClaimFilterValues, page: number) => {
      const params: Record<string, string | number> = {
        page,
        limit: PAGE_SIZE
      };

      if (filters.employee) params.employee = filters.employee;
      if (filters.status) params.status = filters.status;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      return params;
    },
    []
  );

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await claimService.getClaimSummary();
      setSummary(data);
    } catch {
      useToastStore.getState().addToast('Failed to load claim summary', 'error');
      setSummary(EMPTY_SUMMARY);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchClaims = useCallback(async () => {
    setTableLoading(true);
    try {
      const response = await claimService.getClaims(buildQueryParams(filters, currentPage));
      setClaims(response.data || []);
      setTotalCount(response.totalCount || 0);
      setTotalPages(response.totalPages > 0 ? response.totalPages : 1);
    } catch {
      useToastStore.getState().addToast('Failed to load claims', 'error');
      setClaims([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setTableLoading(false);
    }
  }, [filters, buildQueryParams, currentPage]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchSummary(), fetchClaims()]);
  }, [fetchClaims, fetchSummary]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  useEffect(() => {
    if (!showEmployeeFilter) return;

    setEmployeesLoading(true);
    employeeService
      .getEmployees({
        limit: 100,
        manager: role === 'Manager' ? user?.employeeId : undefined
      })
      .then((response) => setEmployees(response.data || []))
      .catch(() => setEmployees([]))
      .finally(() => setEmployeesLoading(false));
  }, [role, showEmployeeFilter, user?.employeeId]);

  const handleFilterChange = (field: keyof ClaimFilterValues, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setEditingClaim(null);
    setIsFormOpen(true);
  };

  const openEditModal = (claim: Claim) => {
    setEditingClaim(claim);
    setIsFormOpen(true);
  };

  const handleApprove = async (claim: Claim) => {
    setActionLoadingId(claim.id);
    try {
      await claimService.approveClaim(claim.id);
      addToast('Claim approved successfully', 'success');
      refreshAll();
    } catch {
      addToast('Failed to approve claim', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (claim: Claim) => {
    setActionLoadingId(claim.id);
    try {
      await claimService.rejectClaim(claim.id);
      addToast('Claim rejected successfully', 'success');
      refreshAll();
    } catch {
      addToast('Failed to reject claim', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReimburse = async (claim: Claim) => {
    setActionLoadingId(claim.id);
    try {
      await claimService.reimburseClaim(claim.id);
      addToast('Claim marked as reimbursed successfully', 'success');
      refreshAll();
    } catch {
      addToast('Failed to reimburse claim', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelClaim) return;
    setActionLoadingId(cancelClaim.id);
    try {
      await claimService.cancelClaim(cancelClaim.id);
      addToast('Claim cancelled successfully', 'success');
      setCancelClaim(null);
      refreshAll();
    } catch {
      addToast('Failed to cancel claim', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteClaim) return;
    setActionLoadingId(deleteClaim.id);
    try {
      await claimService.deleteClaim(deleteClaim.id);
      addToast('Claim deleted successfully', 'success');
      setDeleteClaim(null);
      refreshAll();
    } catch {
      addToast('Failed to delete claim', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="claims-page animate-fade-in">
      <PageHeader
        title="Claims"
        subtitle="Track and manage expense claims"
        actions={
          canCreateClaim ? (
            <button type="button" className="btn-primary" onClick={openCreateModal}>
              <Plus size={18} /> New Claim
            </button>
          ) : undefined
        }
      />

      {summaryLoading ? (
        <LoadingSkeleton variant="cards" count={4} />
      ) : (
        <div className="summary-grid">
          <ClaimSummaryCard
            title="Pending"
            value={summary.Pending}
            icon={<Clock size={24} />}
            variant="blue"
          />
          <ClaimSummaryCard
            title="Approved"
            value={summary.Approved}
            icon={<CheckCircle2 size={24} />}
            variant="green"
          />
          <ClaimSummaryCard
            title="Rejected"
            value={summary.Rejected}
            icon={<XCircle size={24} />}
            variant="red"
          />
          <ClaimSummaryCard
            title="Reimbursed"
            value={summary.Reimbursed}
            icon={<Banknote size={24} />}
            variant="dark"
          />
        </div>
      )}

      <ClaimFilters
        values={filters}
        showEmployeeFilter={showEmployeeFilter}
        employees={employees}
        employeesLoading={employeesLoading}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      <div className="table-card">
        <div className="table-card-header">
          <span className="table-card-count">
            {totalCount} {totalCount === 1 ? 'claim' : 'claims'}
          </span>
        </div>

        <ClaimTable
          claims={claims}
          loading={tableLoading}
          role={role}
          employeeId={user?.employeeId}
          showEmployeeColumn={role !== 'Employee'}
          onView={(claim) => setDetailsClaimId(claim.id)}
          onEdit={openEditModal}
          onCancel={setCancelClaim}
          onDelete={setDeleteClaim}
          onApprove={handleApprove}
          onReject={handleReject}
          onReimburse={handleReimburse}
          actionLoadingId={actionLoadingId}
        />

        {!tableLoading && claims.length > 0 && (
          <div className="table-card-pagination">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <ClaimFormModal
        key={isFormOpen ? (editingClaim?.id ?? 'new') : 'closed'}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingClaim(null);
        }}
        onSuccess={refreshAll}
        editingClaim={editingClaim}
      />

      <ClaimDetailsModal
        key={detailsClaimId}
        isOpen={detailsClaimId !== null}
        claimId={detailsClaimId}
        role={role}
        employeeId={user?.employeeId}
        onClose={() => setDetailsClaimId(null)}
        onUpdated={refreshAll}
      />

      <Modal
        isOpen={cancelClaim !== null}
        onClose={() => setCancelClaim(null)}
        title="Cancel Claim"
        footer={
          <div className="modal-footer-btns">
            <button type="button" className="btn-secondary" onClick={() => setCancelClaim(null)}>
              Go Back
            </button>
            <button
              type="button"
              className="btn-primary btn-danger-action"
              onClick={handleConfirmCancel}
              disabled={actionLoadingId === cancelClaim?.id}
            >
              Confirm Cancellation
            </button>
          </div>
        }
      >
        <p className="claim-cancel-text">
          Are you sure you want to cancel this claim? This action cannot be undone.
        </p>
      </Modal>

      <Modal
        isOpen={deleteClaim !== null}
        onClose={() => setDeleteClaim(null)}
        title="Delete Claim"
        footer={
          <div className="modal-footer-btns">
            <button type="button" className="btn-secondary" onClick={() => setDeleteClaim(null)}>
              Go Back
            </button>
            <button
              type="button"
              className="btn-primary btn-danger-action"
              onClick={handleConfirmDelete}
              disabled={actionLoadingId === deleteClaim?.id}
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        }
      >
        <p className="claim-cancel-text">
          Are you sure you want to permanently delete this claim? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Claims;
