import { useState, useEffect } from 'react';
import { X, Plus, Loader2, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import tenantService, { type TenantListItem, type TenantAdmin } from '../../services/tenant.service';
import AdminFormModal from './AdminFormModal';
import { useToastStore } from '../../components/ui/Toast';

interface TenantDetailsModalProps {
  tenant: TenantListItem;
  onClose: () => void;
  onUpdate: () => void;
}

const TenantDetailsModal = ({ tenant, onClose, onUpdate }: TenantDetailsModalProps) => {
  const addToast = useToastStore((s) => s.addToast);

  const [admins, setAdmins] = useState<TenantAdmin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<TenantAdmin | null>(null);

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const result = await tenantService.getAdmins(tenant.id);
      setAdmins(result);
    } catch {
      addToast('Failed to load admins', 'error');
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [tenant.id]);

  const handleAdminStatusToggle = async (admin: TenantAdmin) => {
    try {
      await tenantService.updateAdmin(tenant.id, admin.id, { isActive: !admin.isActive });
      addToast(`Admin ${admin.isActive ? 'deactivated' : 'activated'}`, 'success');
      fetchAdmins();
    } catch {
      addToast('Failed to update admin status', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{tenant.companyName}</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Company Email</span>
            <span className="detail-value">{tenant.companyEmail}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Company Phone</span>
            <span className="detail-value">{tenant.companyPhone}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status</span>
            <span className={`status-badge ${tenant.status === 'Active' ? 'active' : 'inactive'}`}>
              {tenant.status}
            </span>
          </div>
        </div>

        <div className="section-divider" />

        <div className="section-header">
          <h3>Admins ({admins.length})</h3>
          <button className="btn-primary btn-sm" onClick={() => setShowAddAdmin(true)}>
            <Plus size={16} /> Add Admin
          </button>
        </div>

        {loadingAdmins ? (
          <div className="table-loader"><Loader2 size={24} className="spin" /></div>
        ) : admins.length === 0 ? (
          <div className="table-empty-state"><p>No admins added yet</p></div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>{admin.name}</td>
                    <td>{admin.email}</td>
                    <td>
                      <span className={`status-badge ${admin.isActive ? 'active' : 'inactive'}`}>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btn-group">
                        <button className="action-btn edit" title="Edit" onClick={() => setEditingAdmin(admin)}>
                          <Edit2 size={16} />
                        </button>
                        <button
                          className={`action-btn ${admin.isActive ? 'warning' : 'success'}`}
                          title={admin.isActive ? 'Deactivate' : 'Activate'}
                          onClick={() => handleAdminStatusToggle(admin)}
                        >
                          {admin.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-footer-btns">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>

      {showAddAdmin && (
        <AdminFormModal
          tenantId={tenant.id}
          onClose={() => setShowAddAdmin(false)}
          onSuccess={() => { setShowAddAdmin(false); fetchAdmins(); }}
        />
      )}

      {editingAdmin && (
        <AdminFormModal
          tenantId={tenant.id}
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSuccess={() => { setEditingAdmin(null); fetchAdmins(); }}
        />
      )}
    </div>
  );
};

export default TenantDetailsModal;
