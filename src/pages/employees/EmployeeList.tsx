import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, UserCheck, UserMinus, Edit2, UserX, UserCheck2, X } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatsCard from '../../components/ui/StatsCard';
import Table, { type Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import employeeService, { type Employee } from '../../services/employee.service';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import './EmployeeList.css';

const EmployeeList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    department: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0
  });
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (searchInput === filters.search) return;
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search]);

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    employeeId: string;
    employeeName: string;
    action: 'activate' | 'deactivate';
  }>({
    isOpen: false,
    employeeId: '',
    employeeName: '',
    action: 'deactivate'
  });

  useEffect(() => {
    (async () => {
      try {
        const statsFilters = {
          manager: user?.role === 'Manager' ? user.employeeId : undefined
        };
        const statsRes = await employeeService.getStats(statsFilters);
        setStats(statsRes);
      } catch {
        useToastStore.getState().addToast('Failed to load employee stats', 'error');
      }
    })();
  }, [user?.role, user?.employeeId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const employeeFilters = {
          ...filters,
          manager: user?.role === 'Manager' ? user.employeeId : undefined
        };
        const response = await employeeService.getEmployees(employeeFilters);
        setEmployees(response.data);
        setPagination({
          totalPages: response.totalPages,
          totalItems: response.total
        });
      } catch {
        useToastStore.getState().addToast('Failed to load employees', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [filters, user?.role, user?.employeeId]);

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ ...filters, search: '', department: '', status: '', page: 1 });
  };

  const handleToggleStatus = async () => {
    const { employeeId, action } = confirmModal;
    try {
      if (action === 'deactivate') {
        await employeeService.deleteEmployee(employeeId);
        useToastStore.getState().addToast('Employee deactivated successfully', 'success');
      } else {
        await employeeService.updateEmployee(employeeId, { status: 'Active' });
        useToastStore.getState().addToast('Employee activated successfully', 'success');
      }
      const employeeFilters = {
        page: filters.page, limit: filters.limit, search: filters.search,
        department: filters.department, status: filters.status,
        manager: user?.role === 'Manager' ? user.employeeId : undefined
      };
      const [empRes, statsRes] = await Promise.all([
        employeeService.getEmployees(employeeFilters),
        employeeService.getStats({ manager: user?.role === 'Manager' ? user.employeeId : undefined })
      ]);
      setConfirmModal({ ...confirmModal, isOpen: false });
      setEmployees(empRes.data);
      setPagination({ totalPages: empRes.totalPages, totalItems: empRes.total });
      setStats(statsRes);
    } catch {
      useToastStore.getState().addToast(`Failed to ${action} employee`, 'error');
    }
  };

  const openConfirmModal = (employee: Employee, action: 'activate' | 'deactivate') => {
    setConfirmModal({
      isOpen: true,
      employeeId: employee.id,
      employeeName: employee.fullName,
      action
    });
  };

  const columns: Column<Employee>[] = [
    {
      header: 'Employee ID',
      accessor: (item: Employee) => (
        <span className={`status-badge ${item.status.toLowerCase()}`}>
          {item.employeeId}
        </span>
      )
    },
    { 
      header: 'Name', 
      accessor: (item: Employee) => (
        <div className="employee-cell">
          <div className="employee-avatar employee-avatar-initials">
            {item.fullName.substring(0, 2).toUpperCase()}
          </div>
          <div className="employee-info">
            <span className="employee-name">{item.fullName}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Department',
      accessor: (item: Employee) => (
        <div>
          <div>{item.department}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.designation}</div>
        </div>
      )
    },
    { header: 'Reporting Manager', accessor: (item: Employee) => (item.reportingManager && typeof item.reportingManager === 'object') ? (item.reportingManager as { id: string; fullName: string; employeeId: string }).fullName : 'N/A' },
    { header: 'Role', accessor: (item: Employee) => <span className={`role-badge ${item.role.toLowerCase()}`}>{item.role}</span> },
    { header: 'Modified By', accessor: (item: Employee) => {
      if (!item.modifiedBy) return <span style={{ color: 'var(--text-muted)' }}>-</span>;
      const date = item.modifiedAt ? new Date(item.modifiedAt).toLocaleDateString('en-IN', { timeZone: 'UTC' }) : '';
      return (
        <div>
          <div>{item.modifiedBy.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{date}</div>
        </div>
      );
    } },
    { 
      header: 'Actions', 
      accessor: (item: Employee) => (
        <div className="action-btns">
          <button className="action-btn action-btn-edit" onClick={(e) => { e.stopPropagation(); navigate(`/employees/edit/${item.id}`); }} title="Edit">
            <Edit2 size={18} />
          </button>
          {item.status === 'Active' ? (
            <button className="action-btn action-btn-delete" onClick={(e) => { e.stopPropagation(); openConfirmModal(item, 'deactivate'); }} title="Deactivate">
              <UserX size={18} />
            </button>
          ) : (
            <button className="action-btn action-btn-approve" onClick={(e) => { e.stopPropagation(); openConfirmModal(item, 'activate'); }} title="Activate">
              <UserCheck2 size={18} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="employee-list-page">
      <PageHeader 
        title="Employees" 
        subtitle="Manage your organization's workforce"
        actions={
          <button className="btn-primary" onClick={() => navigate('/employees/add')}>
            <Plus size={20} /> Add Employee
          </button>
        }
      />

      <div className="summary-grid">
        <StatsCard title="Total Employees" value={stats.total} icon={<Users size={24} />} variant="dark" />
        <StatsCard title="Active" value={stats.active} icon={<UserCheck size={24} />} variant="green" />
        <StatsCard title="Inactive" value={stats.inactive} icon={<UserMinus size={24} />} variant="red" />
      </div>

      <div className="filter-card">
        <div className="filter-bar">
          <div className="filter-search">
            <Search size={18} className="filter-search-icon" />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="filter-select">
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value, page: 1 })}
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>

          <div className="filter-select">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <button
            type="button"
            className="filter-clear-btn"
            onClick={clearFilters}
            disabled={!searchInput && !filters.department && !filters.status}
            title="Clear filters"
            aria-label="Clear filters"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div>
        <Table 
          columns={columns} 
          data={employees} 
          loading={loading}
          onRowClick={(item) => navigate(`/employees/${item.id}`)}
        />
        <Pagination 
          currentPage={filters.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={filters.limit}
          onPageChange={(page) => setFilters({ ...filters, page })}
        />
      </div>

      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.action === 'activate' ? 'Activate Employee' : 'Deactivate Employee'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
              Cancel
            </button>
            <button 
              className={confirmModal.action === 'activate' ? 'btn-primary' : 'btn-primary'} 
              style={confirmModal.action === 'deactivate' ? { backgroundColor: '#ef4444' } : {}}
              onClick={handleToggleStatus}
            >
              Confirm {confirmModal.action === 'activate' ? 'Activation' : 'Deactivation'}
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to <strong>{confirmModal.action}</strong> employee <strong>{confirmModal.employeeName}</strong>?
          {confirmModal.action === 'deactivate' ? 
            ' They will no longer be able to log in to the system.' : 
            ' This will restore their access to the system.'}
        </p>
      </Modal>
    </div>
  );
};

export default EmployeeList;
