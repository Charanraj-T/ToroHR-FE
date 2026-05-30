import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import tenantService, { type TenantListItem, type CreateTenantPayload, type UpdateTenantPayload } from '../../services/tenant.service';
import { useToastStore } from '../../store/toastStore';

interface TenantFormModalProps {
  isOpen: boolean;
  tenant?: TenantListItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TenantFormModal = ({ isOpen, tenant, onClose, onSuccess }: TenantFormModalProps) => {
  const addToast = useToastStore((s) => s.addToast);
  const isEdit = !!tenant;

  const [form, setForm] = useState<CreateTenantPayload>({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    status: 'Active',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) {
      setForm({
        companyName: tenant.companyName,
        companyEmail: tenant.companyEmail,
        companyPhone: tenant.companyPhone,
        status: tenant.status,
      });
    } else {
      setForm({ companyName: '', companyEmail: '', companyPhone: '', status: 'Active' });
    }
    setError(null);
  }, [tenant, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.companyName.trim() || !form.companyEmail.trim() || !form.companyPhone.trim()) {
      setError('All fields are required');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && tenant) {
        const payload: UpdateTenantPayload = {
          companyName: form.companyName,
          companyEmail: form.companyEmail,
          companyPhone: form.companyPhone,
          status: form.status,
        };
        await tenantService.update(tenant.id, payload);
        addToast('Tenant updated successfully', 'success');
      } else {
        await tenantService.create(form);
        addToast('Tenant created successfully', 'success');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save tenant');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Tenant' : 'Create Tenant'}
      footer={
        <div className="modal-footer-btns">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="tenant-form" className="btn-primary" disabled={saving}>
            {saving ? <><Loader2 size={16} className="spin" /> Saving...</> : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      }
    >
      <form id="tenant-form" onSubmit={handleSubmit}>
        {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="form-group">
          <label className="form-label" htmlFor="companyName">Company Name</label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            className="form-input"
            value={form.companyName}
            onChange={handleChange}
            placeholder="Acme Pvt Ltd"
            required
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="companyEmail">Company Email</label>
          <input
            id="companyEmail"
            name="companyEmail"
            type="email"
            className="form-input"
            value={form.companyEmail}
            onChange={handleChange}
            placeholder="hello@acme.com"
            required
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="companyPhone">Company Phone</label>
          <input
            id="companyPhone"
            name="companyPhone"
            type="tel"
            className="form-input"
            value={form.companyPhone}
            onChange={handleChange}
            placeholder="9876543210"
            required
            disabled={saving}
          />
        </div>

        {isEdit && (
          <div className="form-group">
            <label className="form-label" htmlFor="status">Status</label>
            <select id="status" name="status" className="form-input" value={form.status} onChange={handleChange} disabled={saving}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default TenantFormModal;
