import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import claimService, { type Claim } from '../../services/claim.service';
import ClaimFilters, { type ClaimFilterValues } from './components/ClaimFilters';
import ClaimTable from './components/ClaimTable';
import ClaimDetailsModal from './components/ClaimDetailsModal';
import './Claims.css';

const PAGE_SIZE = 10;

const EMPTY_FILTERS: ClaimFilterValues = {
  search: '',
  status: '',
  dateFrom: '',
  dateTo: ''
};

const TeamClaimsManagement = () => {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const role = user?.role || 'Admin';

  const [claims, setClaims] = useState<Claim[]>([]);

  const [tableLoading, setTableLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<ClaimFilterValues>(EMPTY_FILTERS);

  const [detailsClaimId, setDetailsClaimId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const buildQueryParams = useCallback(
    (filters: ClaimFilterValues, page: number) => {
      const params: Record<string, string | number> = {
        page,
        limit: PAGE_SIZE
      };

      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      return params;
    },
    []
  );

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
    await fetchClaims();
  }, [fetchClaims]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleFilterChange = (field: keyof ClaimFilterValues, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
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

  return (
    <div className="claims-page animate-fade-in">
      <PageHeader
        title="Team Claims"
        subtitle="Manage and review all expense claims across your team."
      />

      <ClaimFilters
        values={filters}
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
          showEmployeeColumn={true}
          onView={(claim) => setDetailsClaimId(claim.id)}
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

      <ClaimDetailsModal
        key={detailsClaimId}
        isOpen={detailsClaimId !== null}
        claimId={detailsClaimId}
        role={role}
        employeeId={user?.employeeId}
        onClose={() => setDetailsClaimId(null)}
        onUpdated={refreshAll}
      />
    </div>
  );
};

export default TeamClaimsManagement;
