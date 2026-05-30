import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import tenantService, { type TenantAdmin, type CreateAdminPayload, type UpdateAdminPayload } from '../../services/tenant.service';
import { useToastStore } from '../../store/toastStore';

interface AdminFormModalProps {
  isOpen: boolean;
  tenantId: string;
  admin?: TenantAdmin | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminFormModal = ({ isOpen, tenantId, admin, onClose, onSuccess }: AdminFormModalProps) => {
  const addToast = useToastStore((s) => s.addToast);
  const isEdit = !!admin;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (admin) {
        setName(admin.name);
        setEmail(admin.email);
        setPassword('');
      } else {
        setName('');
        setEmail('');
        setPassword('');
      }
      setError(null);
    }
  }, [admin, isOpen]);

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
        if (password.trim()) payload.password = password;
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Admin' : 'Add Admin'}
      footer={
        <div className="modal-footer-btns">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="admin-form" className="btn-primary" disabled={saving}>
            {saving ? <><Loader2 size={16} className="spin" /> Saving...</> : isEdit ? 'Update' : 'Add Admin'}
          </button>
        </div>
      }
    >
      <form id="admin-form" onSubmit={handleSubmit}>
        {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="form-group">
          <label className="form-label" htmlFor="adminName">Name</label>
          <input
            id="adminName"
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Admin Name"
            required
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="adminEmail">Email</label>
          <input
            id="adminEmail"
            type="email"
            className={`form-input${isEdit ? ' form-input-disabled' : ''}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@acme.com"
            required
            disabled={saving || isEdit}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="adminPassword">{isEdit ? 'New Password (optional)' : 'Password'}</label>
          <input
            id="adminPassword"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEdit ? 'Leave blank to keep current' : 'Min 6 characters'}
            required={!isEdit}
            disabled={saving}
          />
        </div>
      </form>
    </Modal>
  );
};

export default AdminFormModal;
