import { useEffect, useState, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import tenantService, { type TenantListItem } from '../../services/tenant.service';
import TenantTable from './TenantTable';
import TenantFormModal from './TenantFormModal';
import TenantDetailsModal from './TenantDetailsModal';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import PageHeader from '../../components/ui/PageHeader';
import './Tenants.css';

const Tenants = () => {
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);

  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
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
      const result = await tenantService.list({ page, limit });
      setTenants(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch {
      addToast('Failed to load tenants', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, addToast]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

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
    <div className="page-content animate-fade-in">
      <PageHeader
        title="Tenants"
        subtitle={`${totalCount} total`}
        actions={
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> Create Tenant
          </button>
        }
      />

      <div className="table-card">
        <TenantTable
          tenants={tenants}
          loading={loading}
          onView={(t) => setViewingTenant(t)}
          onEdit={(t) => setEditingTenant(t)}
          onStatusToggle={handleStatusToggle}
        />

        {totalPages > 1 && (
          <div className="table-card-pagination">
            <div className="pagination">
              <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="pagination-info">Page {page} of {totalPages}</span>
              <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <TenantFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreated}
      />

      <TenantFormModal
        isOpen={!!editingTenant}
        tenant={editingTenant}
        onClose={() => setEditingTenant(null)}
        onSuccess={handleUpdated}
      />

      <TenantDetailsModal
        isOpen={!!viewingTenant}
        tenant={viewingTenant}
        onClose={() => setViewingTenant(null)}
        onUpdate={fetchTenants}
      />
    </div>
  );
};

export default Tenants;
