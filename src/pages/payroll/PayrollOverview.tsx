import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Settings, Wallet } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import payrollService, { type Payroll, type PayrollSummary } from '../../services/payroll.service';
import employeeService, { type Employee } from '../../services/employee.service';
import PayrollSummaryCards from './components/PayrollSummaryCards';
import PayrollFilters, { type PayrollFilterValues } from './components/PayrollFilters';
import PayrollTable from './components/PayrollTable';
import PayslipViewerModal from './components/PayslipViewerModal';
import { MONTH_NAMES, buildYearOptions, downloadBlob, getCurrentYearMonth } from './payrollHelpers';
import './Payroll.css';

const PAGE_SIZE = 10;
const { month: defaultMonth, year: defaultYear } = getCurrentYearMonth();

const EMPTY_FILTERS: PayrollFilterValues = {
  month: String(defaultMonth),
  year: String(defaultYear),
  employee: '',
  status: ''
};

const EMPTY_SUMMARY: PayrollSummary = { Draft: 0, Processed: 0, Paid: 0 };

const PayrollOverview = () => {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const role = user?.role || 'Employee';
  const isAdmin = role === 'Admin';

  const [records, setRecords] = useState<Payroll[]>([]);
  const [summary, setSummary] = useState<PayrollSummary>(EMPTY_SUMMARY);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<PayrollFilterValues>(EMPTY_FILTERS);

  const [viewPayroll, setViewPayroll] = useState<Payroll | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genMonth, setGenMonth] = useState(String(defaultMonth));
  const [genYear, setGenYear] = useState(String(defaultYear));
  const [generateLoading, setGenerateLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const years = buildYearOptions();

  const buildParams = useCallback(
    (page: number) => {
      const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;
      if (filters.employee) params.employee = filters.employee;
      if (filters.status) params.status = filters.status;
      return params;
    },
    [filters]
  );

  const handleFilterChange = useCallback((field: keyof PayrollFilterValues, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await payrollService.getPayrollSummary();
      setSummary(data);
    } catch {
      setSummary(EMPTY_SUMMARY);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const response = await payrollService.getPayroll(buildParams(currentPage));
      setRecords(response.data || []);
      setTotalCount(response.totalCount || 0);
      setTotalPages(response.totalPages > 0 ? response.totalPages : 1);
    } catch {
      setRecords([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setTableLoading(false);
    }
  }, [buildParams, currentPage]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchSummary(), fetchRecords()]);
  }, [fetchSummary, fetchRecords]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  useEffect(() => {
    employeeService
      .getEmployees({
        limit: 100,
        manager: role === 'Manager' ? user?.employeeId : undefined
      })
      .then((res) => setEmployees(res.data || []))
      .catch(() => setEmployees([]))
      .finally(() => setEmployeesLoading(false));
  }, [role, user?.employeeId]);

  const handleDownload = async (record: Payroll) => {
    setDownloadLoading(true);
    try {
      const blob = await payrollService.downloadPayslipPdf(record.id);
      downloadBlob(blob, `${record.payrollNumber}.pdf`);
      addToast('PDF downloaded successfully', 'success');
    } catch {
      addToast('Failed to download payslip', 'error');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleProcess = async (record: Payroll) => {
    setActionLoadingId(record.id);
    try {
      await payrollService.processPayroll(record.id);
      addToast('Payroll processed successfully', 'success');
      refreshAll();
    } catch {
      addToast('Failed to process payroll', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkPaid = async (record: Payroll) => {
    setActionLoadingId(record.id);
    try {
      await payrollService.markPaid(record.id);
      addToast('Payroll marked as paid successfully', 'success');
      refreshAll();
    } catch {
      addToast('Failed to mark payroll as paid', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRegenerate = async (record: Payroll) => {
    const empId = record.employee?.id;
    if (!empId) return;
    setActionLoadingId(record.id);
    try {
      await payrollService.regeneratePayroll(empId, {
        month: record.month,
        year: record.year
      });
      addToast('Payroll regenerated successfully', 'success');
      refreshAll();
    } catch {
      addToast('Failed to regenerate payroll', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleGenerate = async () => {
    setGenerateLoading(true);
    try {
      const result = await payrollService.generatePayroll({
        month: parseInt(genMonth, 10),
        year: parseInt(genYear, 10)
      });
      addToast(
        `Payroll generated: ${result.generatedCount} created, ${result.skippedCount} skipped`,
        'success'
      );
      if (result.warnings?.length) {
        result.warnings.forEach((w) => addToast(w, 'info'));
      }
      setGenerateOpen(false);
      refreshAll();
    } catch {
      addToast('Failed to generate payroll', 'error');
    } finally {
      setGenerateLoading(false);
    }
  };

  return (
    <div className="payroll-page animate-fade-in">
      <PageHeader
        title="Payroll"
        subtitle="Manage payroll and payslips"
        actions={
          <div className="payroll-header-actions">
            {isAdmin && (
              <>
                <Link to="/payroll/salary-structure" className="btn-secondary">
                  <Wallet size={18} /> Salary Structure
                </Link>
                <Link to="/settings?tab=payroll" className="btn-secondary">
                  <Settings size={18} /> Settings
                </Link>
                <button type="button" className="btn-primary" onClick={() => setGenerateOpen(true)}>
                  <Plus size={18} /> Generate Payroll
                </button>
              </>
            )}
            {role === 'Manager' && (
              <Link to="/payroll/my-payslips" className="btn-secondary">
                My Payslips
              </Link>
            )}
          </div>
        }
      />

      <PayrollSummaryCards summary={summary} loading={summaryLoading} />

      <PayrollFilters
        values={filters}
        showEmployeeFilter={isAdmin || role === 'Manager'}
        employees={employees}
        employeesLoading={employeesLoading}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      <div className="payroll-table-card">
        <div className="payroll-table-header">
          <span className="payroll-count-badge">
            {totalCount} {totalCount === 1 ? 'record' : 'records'}
          </span>
        </div>

        <PayrollTable
          records={records}
          loading={tableLoading}
          role={role}
          onView={setViewPayroll}
          onProcess={isAdmin ? handleProcess : undefined}
          onMarkPaid={isAdmin ? handleMarkPaid : undefined}
          onRegenerate={isAdmin ? handleRegenerate : undefined}
          onDownload={handleDownload}
          actionLoadingId={actionLoadingId}
        />

        {!tableLoading && records.length > 0 && (
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
        onDownload={
          viewPayroll
            ? () => handleDownload(viewPayroll)
            : undefined
        }
        downloadLoading={downloadLoading}
      />

      <Modal
        isOpen={generateOpen}
        onClose={() => setGenerateOpen(false)}
        title="Generate Payroll"
        footer={
          <div className="modal-footer-btns">
            <button type="button" className="btn-secondary" onClick={() => setGenerateOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleGenerate}
              disabled={generateLoading}
            >
              {generateLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        }
      >
        <div className="generate-payroll-form">
          <p className="generate-hint">Generate draft payroll for all active employees.</p>
          <div className="generate-row">
            <div className="form-group">
              <label className="form-label">Month</label>
              <select className="form-input" value={genMonth} onChange={(e) => setGenMonth(e.target.value)}>
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={String(i + 1)}>{name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Year</label>
              <select className="form-input" value={genYear} onChange={(e) => setGenYear(e.target.value)}>
                {years.map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PayrollOverview;
