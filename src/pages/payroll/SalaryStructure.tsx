import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import payrollService, { type SalaryStructure } from '../../services/payroll.service';
import employeeService, { type Employee } from '../../services/employee.service';
import SalaryStructureTable from './components/SalaryStructureTable';
import SalaryFormModal from './components/SalaryFormModal';
import './Payroll.css';

const PAGE_SIZE = 10;

const SalaryStructurePage = () => {
  const [records, setRecords] = useState<SalaryStructure[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SalaryStructure | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await payrollService.getSalaryStructures({
        page: currentPage,
        limit: PAGE_SIZE
      });
      setRecords(response.data || []);
      setTotalCount(response.totalCount || 0);
      setTotalPages(response.totalPages > 0 ? response.totalPages : 1);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    employeeService
      .getEmployees({ limit: 200, status: 'Active' })
      .then((res) => setEmployees(res.data || []))
      .catch(() => setEmployees([]));
  }, []);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (record: SalaryStructure) => {
    setEditing(record);
    setFormOpen(true);
  };

  return (
    <div className="payroll-page animate-fade-in">
      <PageHeader
        title="Salary Structure"
        subtitle="Manage versioned monthly salary for employees"
        actions={
          <button type="button" className="btn-primary" onClick={openAdd}>
            <Plus size={18} /> Add Salary
          </button>
        }
      />

      <div className="payroll-table-card">
        <SalaryStructureTable
          records={records}
          loading={loading}
          onEdit={openEdit}
          onAdd={openAdd}
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

      <SalaryFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSuccess={fetchRecords}
        employees={employees}
        editingStructure={editing}
      />
    </div>
  );
};

export default SalaryStructurePage;
