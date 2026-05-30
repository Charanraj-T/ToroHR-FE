import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import payrollService, { type Payroll } from '../../services/payroll.service';
import PayrollFilters, { type PayrollFilterValues } from './components/PayrollFilters';
import PayrollTable from './components/PayrollTable';
import PayslipViewerModal from './components/PayslipViewerModal';
import { downloadBlob, getCurrentYearMonth } from './payrollHelpers';
import './Payroll.css';

const PAGE_SIZE = 10;
const { month: defaultMonth, year: defaultYear } = getCurrentYearMonth();

const EMPTY_FILTERS: PayrollFilterValues = {
  month: String(defaultMonth),
  year: String(defaultYear),
  employee: '',
  status: ''
};

const MyPayslips = () => {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const role = user?.role || 'Employee';

  const [records, setRecords] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<PayrollFilterValues>(EMPTY_FILTERS);

  const [viewPayroll, setViewPayroll] = useState<Payroll | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const handleFilterChange = useCallback((field: keyof PayrollFilterValues, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await payrollService.getMyPayslips({
        page: currentPage,
        limit: PAGE_SIZE,
        ...(filters.month && { month: filters.month }),
        ...(filters.year && { year: filters.year }),
        ...(filters.status && { status: filters.status })
      });
      setRecords(response.data || []);
      setTotalCount(response.totalCount || 0);
      setTotalPages(response.totalPages > 0 ? response.totalPages : 1);
    } catch {
      setRecords([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleDownload = async (record: Payroll) => {
    setDownloadLoading(true);
    try {
      const blob = await payrollService.downloadPayslipPdf(record.id);
      downloadBlob(blob, `${record.payrollNumber}.pdf`);
      addToast('PDF downloaded successfully', 'success');
    } catch {
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="payroll-page animate-fade-in">
      <PageHeader
        title={role === 'Manager' ? 'My Payslips' : 'Payroll'}
        subtitle="View and download your payslips"
      />

      <PayrollFilters
        values={filters}
        showEmployeeFilter={false}
        showStatusFilter
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      <div className="payroll-table-card">
        <div className="payroll-table-header">
          <span className="payroll-count-badge">
            {totalCount} {totalCount === 1 ? 'payslip' : 'payslips'}
          </span>
        </div>

        <PayrollTable
          records={records}
          loading={loading}
          role={role}
          showEmployeeColumn={false}
          onView={setViewPayroll}
          onDownload={handleDownload}
        />

        {!loading && records.length > 0 && (
          <div className="payroll-pagination-wrapper">
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

      <PayslipViewerModal
        isOpen={viewPayroll !== null}
        payroll={viewPayroll}
        onClose={() => setViewPayroll(null)}
        onDownload={viewPayroll ? () => handleDownload(viewPayroll) : undefined}
        downloadLoading={downloadLoading}
      />
    </div>
  );
};

export default MyPayslips;
