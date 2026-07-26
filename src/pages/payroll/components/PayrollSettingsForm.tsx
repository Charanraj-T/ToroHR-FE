import { useCallback, useEffect, useState } from 'react';
import { Loader2, Save, Search } from 'lucide-react';
import Table, { type Column } from '../../../components/ui/Table';
import Pagination from '../../../components/ui/Pagination';
import payrollService, { type PayrollSettings, type ManagerPayrollAccess } from '../../../services/payroll.service';
import { useToastStore } from '../../../store/toastStore';
import './PayrollSettingsForm.css';

const MANAGERS_PAGE_SIZE = 10;

const PayrollSettingsForm = () => {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payrollGenerationDay, setPayrollGenerationDay] = useState('1');
  const [defaultPF, setDefaultPF] = useState('1800');

  const [managers, setManagers] = useState<ManagerPayrollAccess[]>([]);
  const [managersLoading, setManagersLoading] = useState(true);
  const [managersPage, setManagersPage] = useState(1);
  const [managersTotalPages, setManagersTotalPages] = useState(1);
  const [managersTotal, setManagersTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    payrollService
      .getPayrollSettings()
      .then((settings: PayrollSettings) => {
        setPayrollGenerationDay(String(settings.payrollGenerationDay));
        setDefaultPF(String(settings.defaultPF));
      })
      .catch(() => {
        setLoadError(true);
        addToast('Failed to load settings', 'error');
      })
      .finally(() => setLoading(false));
  }, [addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setManagersPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchManagers = useCallback(async () => {
    setManagersLoading(true);
    try {
      const result = await payrollService.getManagersPayrollAccess({
        page: managersPage,
        limit: MANAGERS_PAGE_SIZE,
        ...(search && { search })
      });
      setManagers(result.data || []);
      setManagersTotal(result.totalCount || 0);
      setManagersTotalPages(result.totalPages > 0 ? result.totalPages : 1);
    } catch {
      setManagers([]);
      setManagersTotal(0);
      setManagersTotalPages(1);
    } finally {
      setManagersLoading(false);
    }
  }, [managersPage, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchManagers();
  }, [fetchManagers]);

  const handleToggleAccess = async (manager: ManagerPayrollAccess) => {
    setTogglingId(manager.id);
    try {
      const updated = await payrollService.toggleManagerPayrollAccess(manager.id);
      setManagers((prev) =>
        prev.map((m) => (m.id === updated.id ? { ...m, payrollAccess: updated.payrollAccess } : m))
      );
      addToast(
        `Payroll access ${updated.payrollAccess ? 'granted to' : 'revoked from'} ${manager.fullName}`,
        'success'
      );
    } catch {
      addToast('Failed to update payroll access', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await payrollService.updatePayrollSettings({
        payrollGenerationDay: parseInt(payrollGenerationDay, 10),
        defaultPF: parseFloat(defaultPF)
      });
      addToast('Payroll settings updated successfully', 'success');
    } catch {
      addToast('Failed to update payroll settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const managerColumns: Column<ManagerPayrollAccess>[] = [
    {
      header: 'Manager',
      accessor: (item) => (
        <div className="employee-cell">
          <div className="employee-avatar employee-avatar-initials">
            {item.fullName.substring(0, 2).toUpperCase()}
          </div>
          <div className="employee-info">
            <span className="employee-name">{item.fullName}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.email}</span>
          </div>
        </div>
      )
    },
    { header: 'Employee ID', accessor: (item) => item.employeeId },
    {
      header: 'Access',
      accessor: (item) => (
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={item.payrollAccess}
            onChange={() => handleToggleAccess(item)}
            disabled={togglingId === item.id}
          />
          <span className="toggle-slider" />
        </label>
      )
    }
  ];

  if (loading) {
    return (
      <div className="settings-loading">
        <Loader2 size={24} className="spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="settings-loading">
        <p>Failed to load settings. Please refresh the page and try again.</p>
      </div>
    );
  }

  return (
    <div className="payroll-settings-layout">
      <div className="payroll-settings-sidebar">
        <form className="settings-form-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="payrollGenerationDay">
              Payroll Generation Day
            </label>
            <p className="form-hint">Day of month when previous month payroll is auto-generated (1–28)</p>
            <input
              id="payrollGenerationDay"
              type="number"
              min="1"
              max="28"
              className="form-input"
              value={payrollGenerationDay}
              onChange={(e) => setPayrollGenerationDay(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="defaultPF">
              Default PF (INR)
            </label>
            <p className="form-hint">Default provident fund deduction for full-time employees</p>
            <input
              id="defaultPF"
              type="number"
              min="0"
              step="1"
              className="form-input"
              value={defaultPF}
              onChange={(e) => setDefaultPF(e.target.value)}
              required
            />
          </div>

          <div className="settings-form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={18} className="spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={18} /> Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="payroll-settings-main">
        <div className="filter-card">
          <div className="filter-bar">
            <div className="filter-search">
              <Search size={18} className="filter-search-icon" />
              <input
                type="text"
                placeholder="Search by name or employee ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Table
          columns={managerColumns}
          data={managers}
          loading={managersLoading}
        />

        {managersTotal > 0 && (
          <Pagination
            currentPage={managersPage}
            totalPages={managersTotalPages}
            totalItems={managersTotal}
            itemsPerPage={MANAGERS_PAGE_SIZE}
            onPageChange={setManagersPage}
          />
        )}
      </div>
    </div>
  );
};

export default PayrollSettingsForm;
