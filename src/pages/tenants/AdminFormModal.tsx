import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import tenantService, { type TenantAdmin, type CreateAdminPayload, type UpdateAdminPayload } from '../../services/tenant.service';
import { useToastStore } from '../../components/ui/Toast';

interface AdminFormModalProps {
  tenantId: string;
  admin?: TenantAdmin | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminFormModal = ({ tenantId, admin, onClose, onSuccess }: AdminFormModalProps) => {
  const addToast = useToastStore((s) => s.addToast);
  const isEdit = !!admin;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (admin) {
      setName(admin.name);
      setEmail(admin.email);
    }
  }, [admin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError('Name and email are required');
      return;
    }

    if (!isEdit && !password.trim()) {
      setError('Password is required');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && admin) {
        const payload: UpdateAdminPayload = { name };
        await tenantService.updateAdmin(tenantId, admin.id, payload);
        addToast('Admin updated successfully', 'success');
      } else {
        const payload: CreateAdminPayload = { name, email, password };
        await tenantService.createAdmin(tenantId, payload);
        addToast('Admin created successfully', 'success');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save admin');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Admin' : 'Add Admin'}</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="adminName">Name</label>
              <input
                id="adminName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Admin Name"
                required
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="adminEmail">Email</label>
              <input
                id="adminEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@acme.com"
                required
                disabled={saving || isEdit}
              />
            </div>

            {!isEdit && (
              <div className="form-group">
                <label htmlFor="adminPassword">Password</label>
                <input
                  id="adminPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  disabled={saving}
                />
              </div>
            )}
          </div>

          <div className="modal-footer-btns">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <><Loader2 size={16} className="spin" /> Saving...</> : isEdit ? 'Update' : 'Add Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminFormModal;
