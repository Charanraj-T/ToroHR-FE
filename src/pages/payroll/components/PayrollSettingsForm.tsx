import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import payrollService, { type PayrollSettings } from '../../../services/payroll.service';
import { useToastStore } from '../../../store/toastStore';
import LoadingSkeleton from '../../claims/components/LoadingSkeleton';
import './PayrollSettingsForm.css';

const PayrollSettingsForm = () => {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payrollGenerationDay, setPayrollGenerationDay] = useState('1');
  const [defaultPF, setDefaultPF] = useState('1800');

  useEffect(() => {
    payrollService
      .getPayrollSettings()
      .then((settings: PayrollSettings) => {
        setPayrollGenerationDay(String(settings.payrollGenerationDay));
        setDefaultPF(String(settings.defaultPF));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await payrollService.updatePayrollSettings({
        payrollGenerationDay: parseInt(payrollGenerationDay, 10),
        defaultPF: parseFloat(defaultPF)
      });
      addToast('Payroll settings updated successfully', 'success');
    } catch {
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton variant="table" count={3} />;
  }

  return (
    <form className="payroll-settings-form" onSubmit={handleSubmit}>
      <div className="settings-form-card">
        <div className="form-group">
          <label className="form-label" htmlFor="payrollGenerationDay">
            Payroll Generation Day
          </label>
          <p className="form-hint">Day of month when previous month payroll is auto-generated (1–28)</p>
          <input
            id="payrollGenerationDay"
            type="number"
            min="1"
            max="28"
            className="form-input"
            value={payrollGenerationDay}
            onChange={(e) => setPayrollGenerationDay(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="defaultPF">
            Default PF (INR)
          </label>
          <p className="form-hint">Default provident fund deduction for full-time employees</p>
          <input
            id="defaultPF"
            type="number"
            min="0"
            step="1"
            className="form-input"
            value={defaultPF}
            onChange={(e) => setDefaultPF(e.target.value)}
            required
          />
        </div>

        <div className="settings-form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={18} className="spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={18} /> Save
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PayrollSettingsForm;
