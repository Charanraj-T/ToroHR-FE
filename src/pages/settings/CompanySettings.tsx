import { useState, useEffect } from 'react';
import { Building2, MapPin, Edit2, X, Save, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import settingsService, { type CompanySettings } from '../../services/settings.service';
import PageHeader from '../../components/ui/PageHeader';
import { InputField } from '../../components/ui/FormFields';
import './CompanySettings.css';

const CompanySettingsPage = () => {
  const { addToast } = useToastStore();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'Admin';

  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyLogo: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await settingsService.getCompanySettings();
        setSettings(data);
        setForm({
          companyName: data.companyName || '',
          companyEmail: data.companyEmail || '',
          companyPhone: data.companyPhone || '',
          companyLogo: data.companyLogo || '',
          addressLine1: data.addressLine1 || '',
          addressLine2: data.addressLine2 || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
          postalCode: data.postalCode || '',
        });
      } catch {
        addToast('Failed to load company settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.companyName.trim()) e.companyName = 'Company name is required';
    if (!form.companyEmail.trim()) e.companyEmail = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.companyEmail)) e.companyEmail = 'Invalid email format';
    if (form.companyPhone && !/^[\d\s\-+()]{7,20}$/.test(form.companyPhone)) e.companyPhone = 'Invalid phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const updated = await settingsService.updateCompanySettings(form);
      setSettings(updated);
      setEditing(false);
      addToast('Company settings updated successfully', 'success');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update company settings';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (settings) {
      setForm({
        companyName: settings.companyName || '',
        companyEmail: settings.companyEmail || '',
        companyPhone: settings.companyPhone || '',
        companyLogo: settings.companyLogo || '',
        addressLine1: settings.addressLine1 || '',
        addressLine2: settings.addressLine2 || '',
        city: settings.city || '',
        state: settings.state || '',
        country: settings.country || '',
        postalCode: settings.postalCode || '',
      });
    }
    setErrors({});
    setEditing(false);
  };

  if (loading) {
    return <div className="loading-state">Loading company settings...</div>;
  }

  if (editing) {
    return (
      <div className="company-settings-page">
        <PageHeader
          title="Company Settings"
          subtitle="Update your organization information"
        />

        <div className="cs-form-sections">
          <div className="cs-form-card">
            <h3><Building2 size={18} /> Company Details</h3>
            <div className="cs-form-grid">
              <InputField
                label="Company Name"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                error={errors.companyName}
                placeholder="Your Company Pvt. Ltd."
                required
              />
              <InputField
                label="Company Email"
                name="companyEmail"
                type="email"
                value={form.companyEmail}
                onChange={handleChange}
                error={errors.companyEmail}
                placeholder="company@company.co.in"
                required
              />
              <InputField
                label="Company Phone"
                name="companyPhone"
                value={form.companyPhone}
                onChange={handleChange}
                error={errors.companyPhone}
                placeholder="+91 98765 43210"
              />
              <InputField
                label="Company Logo URL"
                name="companyLogo"
                value={form.companyLogo}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          <div className="cs-form-card">
            <h3><MapPin size={18} /> Address Details</h3>
            <div className="cs-form-grid">
              <InputField
                label="Address Line 1"
                name="addressLine1"
                value={form.addressLine1}
                onChange={handleChange}
                placeholder="123, MG Road"
              />
              <InputField
                label="Address Line 2"
                name="addressLine2"
                value={form.addressLine2}
                onChange={handleChange}
                placeholder="Indira Nagar"
              />
              <InputField
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Mumbai"
              />
              <InputField
                label="State"
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="Maharashtra"
              />
              <InputField
                label="Country"
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="India"
              />
              <InputField
                label="Postal Code"
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                placeholder="400001"
              />
            </div>
          </div>
        </div>

        <div className="cs-form-actions">
          <button className="btn-secondary" onClick={handleCancel} disabled={saving}>
            <X size={18} /> Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="company-settings-page">
      <PageHeader
        title="Company Settings"
        subtitle="Organization information and address"
        actions={
          isAdmin ? (
            <button className="btn-primary" onClick={() => setEditing(true)}>
              <Edit2 size={18} /> Edit Company
            </button>
          ) : undefined
        }
      />

      <div className="cs-sections-container">
        <div className="cs-detail-section">
          <div className="cs-section-title">
            <Building2 size={18} /> <h3>Company Details</h3>
          </div>
          <div className="cs-detail-content">
            {settings?.companyLogo && (
              <div className="cs-logo-wrapper">
                <img src={settings.companyLogo} alt={settings.companyName} className="cs-logo" />
              </div>
            )}
            <DetailRow label="Company Name" value={settings?.companyName} />
            <DetailRow label="Company Email" value={settings?.companyEmail} />
            <DetailRow label="Company Phone" value={settings?.companyPhone} />
          </div>
        </div>

        <div className="cs-detail-section">
          <div className="cs-section-title">
            <MapPin size={18} /> <h3>Address Details</h3>
          </div>
          <div className="cs-detail-content">
            <DetailRow label="Address Line 1" value={settings?.addressLine1} />
            <DetailRow label="Address Line 2" value={settings?.addressLine2} />
            <DetailRow label="City" value={settings?.city} />
            <DetailRow label="State" value={settings?.state} />
            <DetailRow label="Country" value={settings?.country} />
            <DetailRow label="Postal Code" value={settings?.postalCode} />
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="cs-detail-row">
    <span className="cs-detail-label">{label}</span>
    <span className="cs-detail-value">{value || '—'}</span>
  </div>
);

export default CompanySettingsPage;