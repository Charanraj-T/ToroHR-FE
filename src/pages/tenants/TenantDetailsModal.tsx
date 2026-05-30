import { useState, useEffect } from 'react';
import { Plus, Loader2, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import tenantService, { type TenantListItem, type TenantAdmin } from '../../services/tenant.service';
import AdminFormModal from './AdminFormModal';
import { useToastStore } from '../../store/toastStore';

interface TenantDetailsModalProps {
  isOpen: boolean;
  tenant: TenantListItem | null;
  onClose: () => void;
  onUpdate: () => void;
}

const TenantDetailsModal = ({ isOpen, tenant, onClose, onUpdate }: TenantDetailsModalProps) => {
  const addToast = useToastStore((s) => s.addToast);

  const [admins, setAdmins] = useState<TenantAdmin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<TenantAdmin | null>(null);

  const fetchAdmins = async () => {
    if (!tenant) return;
    setLoadingAdmins(true);
    try {
      const data = await tenantService.getAdmins(tenant.id);
      setAdmins(data);
    } catch {
      addToast('Failed to load admins', 'error');
    } finally {
      setLoadingAdmins(false);
      onUpdate();
    }
  };

  useEffect(() => {
    if (isOpen && tenant) {
      fetchAdmins();
    }
  }, [isOpen, tenant?.id]);

  const handleAdminStatusToggle = async (admin: TenantAdmin) => {
    try {
      await tenantService.updateAdmin(tenant!.id, admin.id, { isActive: !admin.isActive });
      addToast(`Admin ${admin.isActive ? 'deactivated' : 'activated'}`, 'success');
      fetchAdmins();
    } catch {
      addToast('Failed to update admin status', 'error');
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={tenant?.companyName || 'Tenant Details'}
        className="modal-lg"
        footer={
          <div className="modal-footer-btns">
            <button className="btn-primary btn-sm" onClick={() => setShowAddAdmin(true)}>
              <Plus size={16} /> Add Admin
            </button>
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        }
      >
        {tenant && (
          <>
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
                <span className="detail-value">
                  <span className={`badge ${tenant.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                    {tenant.status}
                  </span>
                </span>
              </div>
            </div>

            <div className="section-divider" />

            <div className="section-header">
              <h3>Admins ({admins.length})</h3>
            </div>

            {loadingAdmins ? (
              <div className="table-loader"><Loader2 size={24} className="spin" /></div>
            ) : admins.length === 0 ? (
              <div className="table-empty"><p>No admins added yet</p></div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
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
                          <span className={`badge ${admin.isActive ? 'badge-success' : 'badge-danger'}`}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="action-btn action-btn-edit" title="Edit" onClick={() => setEditingAdmin(admin)}>
                              <Edit2 size={16} />
                            </button>
                            <button
                              className={`action-btn ${admin.isActive ? 'action-btn-delete' : 'action-btn-approve'}`}
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
          </>
        )}
      </Modal>

      {showAddAdmin && tenant && (
        <AdminFormModal
          isOpen={showAddAdmin}
          tenantId={tenant.id}
          onClose={() => setShowAddAdmin(false)}
          onSuccess={() => { setShowAddAdmin(false); fetchAdmins(); }}
        />
      )}

      {editingAdmin && tenant && (
        <AdminFormModal
          isOpen={!!editingAdmin}
          tenantId={tenant.id}
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSuccess={() => { setEditingAdmin(null); fetchAdmins(); }}
        />
      )}
    </>
  );
};

export default TenantDetailsModal;
