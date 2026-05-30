import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, RefreshCw, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import tenantService, { type TenantListItem } from '../../services/tenant.service';
import TenantTable from './TenantTable';
import TenantFormModal from './TenantFormModal';
import TenantDetailsModal from './TenantDetailsModal';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../components/ui/Toast';
import './Tenants.css';

const Tenants = () => {
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);

  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantListItem | null>(null);
  const [viewingTenant, setViewingTenant] = useState<TenantListItem | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const result = await tenantService.list({ page, limit, search: search || undefined });
      setTenants(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch {
      addToast('Failed to load tenants', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, addToast]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  if (user?.role !== 'SuperAdmin') return null;

  const handleCreated = () => {
    setShowCreateModal(false);
    fetchTenants();
  };

  const handleUpdated = () => {
    setEditingTenant(null);
    fetchTenants();
  };

  const handleStatusToggle = async (tenant: TenantListItem) => {
    const newStatus = tenant.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await tenantService.update(tenant.id, { status: newStatus });
      addToast(`Tenant ${newStatus === 'Active' ? 'activated' : 'inactivated'}`, 'success');
      fetchTenants();
    } catch {
      addToast('Failed to update tenant status', 'error');
    }
  };

  return (
    <div className="tenants-page animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <Building2 size={28} />
          <div>
            <h1>Tenants</h1>
            <p className="page-subtitle">{totalCount} total tenants</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} /> Create Tenant
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-secondary" onClick={fetchTenants} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      <div className="table-card">
        <TenantTable
          tenants={tenants}
          loading={loading}
          onView={(t) => setViewingTenant(t)}
          onEdit={(t) => setEditingTenant(t)}
          onStatusToggle={handleStatusToggle}
        />

        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={16} /> Previous
            </button>
            <span className="pagination-info">Page {page} of {totalPages}</span>
            <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <TenantFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreated}
        />
      )}

      {editingTenant && (
        <TenantFormModal
          tenant={editingTenant}
          onClose={() => setEditingTenant(null)}
          onSuccess={handleUpdated}
        />
      )}

      {viewingTenant && (
        <TenantDetailsModal
          tenant={viewingTenant}
          onClose={() => setViewingTenant(null)}
          onUpdate={fetchTenants}
        />
      )}
    </div>
  );
};

export default Tenants;
