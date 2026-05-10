import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Users, UserCheck, UserMinus, Eye, Edit2, UserX, UserCheck2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatsCard from '../../components/ui/StatsCard';
import Table, { type Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
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

  const fetchStats = async () => {
    try {
      const statsFilters = {
        manager: user?.role === 'Manager' ? user.employeeId : undefined
      };
      const statsRes = await employeeService.getStats(statsFilters);
      setStats(statsRes);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  const fetchEmployees = async () => {
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
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [filters.page, filters.department, filters.status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchEmployees();
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
      setConfirmModal({ ...confirmModal, isOpen: false });
      fetchEmployees();
      fetchStats(); // Refresh stats after status change
    } catch (error) {
      console.error(`Failed to ${action} employee`, error);
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
    { header: 'Employee ID', accessor: 'employeeId' },
    { 
      header: 'Name', 
      accessor: (item: Employee) => (
        <div className="name-cell">
          <div className="name-avatar">
            {item.fullName.substring(0, 2).toUpperCase()}
          </div>
          <div className="name-info">
            <span className="full-name">{item.fullName}</span>
            <span className="email">{item.email}</span>
          </div>
        </div>
      )
    },
    { header: 'Department', accessor: 'department' },
    { header: 'Designation', accessor: 'designation' },
    { 
      header: 'Joining Date', 
      accessor: (item: Employee) => item.joiningDate ? new Date(item.joiningDate).toLocaleDateString('en-IN') : 'N/A' 
    },
    { header: 'Reporting Manager', accessor: (item: Employee) => (item.reportingManager && typeof item.reportingManager === 'object') ? (item.reportingManager as any).fullName : 'N/A' },
    { header: 'Role', accessor: (item: Employee) => <span className={`role-badge ${item.role.toLowerCase()}`}>{item.role}</span> },
    { header: 'Status', accessor: (item: Employee) => <StatusBadge status={item.status} /> },
    { 
      header: 'Actions', 
      accessor: (item: Employee) => (
        <div className="table-actions">
          <button className="action-btn" onClick={(e) => { e.stopPropagation(); navigate(`/employees/${item.id}`); }} title="View">
            <Eye size={18} />
          </button>
          <button className="action-btn edit" onClick={(e) => { e.stopPropagation(); navigate(`/employees/edit/${item.id}`); }} title="Edit">
            <Edit2 size={18} />
          </button>
          {item.status === 'Active' ? (
            <button className="action-btn deactivate" onClick={(e) => { e.stopPropagation(); openConfirmModal(item, 'deactivate'); }} title="Deactivate">
              <UserX size={18} />
            </button>
          ) : (
            <button className="action-btn activate" onClick={(e) => { e.stopPropagation(); openConfirmModal(item, 'activate'); }} title="Activate">
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

      <div className="stats-grid">
        <StatsCard title="Total Employees" value={stats.total} icon={<Users size={24} />} variant="dark" />
        <StatsCard title="Active" value={stats.active} icon={<UserCheck size={24} />} variant="green" />
        <StatsCard title="Inactive" value={stats.inactive} icon={<UserMinus size={24} />} variant="red" />
      </div>

      <div className="list-controls">
        <form className="search-box" onSubmit={handleSearch}>
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name, ID, or email..." 
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </form>

        <div className="filter-group">
          <div className="filter-item">
            <Filter size={16} />
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

          <div className="filter-item">
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="list-table-container">
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
