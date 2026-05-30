import { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import holidayService, { type Holiday } from '../../services/holiday.service';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import HolidayTable from './components/HolidayTable';
import HolidayForm from './components/HolidayForm';
import HolidayFilters from './components/HolidayFilters';
import './Holidays.css';

const LIMIT = 10;

const Holidays = () => {
  const { addToast } = useToastStore();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'Admin';

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editHoliday, setEditHoliday] = useState<Holiday | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchHolidays = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: LIMIT };
      if (search.trim()) params.search = search.trim();
      if (year) params.year = Number(year);

      const res = await holidayService.getHolidays(params);
      setHolidays(res.data);
      setTotalItems(res.total);
      setTotalPages(res.pages);
    } catch {
      addToast('Failed to load holidays', 'error');
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, [search, year]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, year]);

  useEffect(() => {
    fetchHolidays(currentPage);
  }, [currentPage, fetchHolidays]);

  const handleClearFilters = () => {
    setSearch('');
    setYear('');
  };

  const handleAdd = () => {
    setEditHoliday(null);
    setFormOpen(true);
  };

  const handleEdit = (holiday: Holiday) => {
    setEditHoliday(holiday);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditHoliday(null);
    fetchHolidays(currentPage);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await holidayService.deleteHoliday(deleteTarget.id);
      addToast('Holiday deleted successfully', 'success');
      setDeleteTarget(null);
      fetchHolidays(currentPage);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to delete holiday';
      addToast(msg, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="holidays-page animate-fade-in">
      <PageHeader
        title="Holidays"
        subtitle="Manage company holidays and recurring yearly holidays."
        actions={
          isAdmin ? (
            <button className="btn-primary" onClick={handleAdd}>
              <Plus size={18} />
              Add Holiday
            </button>
          ) : undefined
        }
      />

      <HolidayFilters
        search={search}
        year={year}
        onSearchChange={setSearch}
        onYearChange={setYear}
        onClear={handleClearFilters}
      />

      <div className="table-card">
        <HolidayTable
          holidays={holidays}
          loading={loading}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
        />
        {!loading && holidays.length > 0 && (
          <div className="table-card-pagination">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={LIMIT}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditHoliday(null); }}
        title={editHoliday ? 'Edit Holiday' : 'Add Holiday'}
      >
        <HolidayForm
          key={formOpen ? (editHoliday?.id ?? 'new') : 'closed'}
          holiday={editHoliday}
          onSubmitSuccess={handleFormSuccess}
          onCancel={() => { setFormOpen(false); setEditHoliday(null); }}
        />
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Holiday"
      >
        <div className="hp-delete-body">
          <div className="hp-delete-icon">
            <Trash2 size={32} />
          </div>
          <p className="hp-delete-warning">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
          </p>
          <p className="hp-delete-hint">This action cannot be undone.</p>
        </div>
        <div className="hp-delete-footer">
          <button
            className="btn-secondary"
            onClick={() => setDeleteTarget(null)}
            disabled={deleteLoading}
          >
            Cancel
          </button>
          <button
            className="hp-delete-btn"
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Holiday'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Holidays;
