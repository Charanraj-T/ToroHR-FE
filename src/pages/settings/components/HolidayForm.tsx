import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import holidayService, { type Holiday } from '../../../services/holiday.service';
import { useToastStore } from '../../../store/toastStore';
import { InputField } from '../../../components/ui/FormFields';
import './HolidayForm.css';

interface HolidayFormProps {
  holiday?: Holiday | null;
  onSubmitSuccess: () => void;
  onCancel: () => void;
}

const toDateInputValue = (dateStr?: string) => {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
};

const HolidayForm = ({ holiday, onSubmitSuccess, onCancel }: HolidayFormProps) => {
  const { addToast } = useToastStore();
  const isEdit = Boolean(holiday);

  const [name, setName] = useState(holiday?.name || '');
  const [date, setDate] = useState(toDateInputValue(holiday?.date));
  const [description, setDescription] = useState(holiday?.description || '');
  const [isRecurringYearly, setIsRecurringYearly] = useState(holiday?.isRecurringYearly || false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Holiday name is required';
    if (!date) e.date = 'Date is required';
    if (name.trim().length > 100) e.name = 'Name cannot exceed 100 characters';
    if (description.length > 500) e.description = 'Description cannot exceed 500 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        date,
        description: description.trim(),
        isRecurringYearly,
      };

      if (isEdit && holiday) {
        await holidayService.updateHoliday(holiday.id, payload);
        addToast('Holiday updated successfully', 'success');
      } else {
        await holidayService.createHoliday(payload);
        addToast('Holiday created successfully', 'success');
      }

      onSubmitSuccess();
    } catch (error: any) {
      const msg = error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} holiday`;
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="holiday-form" onSubmit={handleSubmit}>
      <div className="hf-fields">
        <InputField
          label="Holiday Name"
          id="holiday-name"
          placeholder="e.g. Republic Day"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          disabled={loading}
          maxLength={100}
        />

        <InputField
          label="Date"
          id="holiday-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
          disabled={loading}
        />

        <div className="hf-group hf-full">
          <label className="hf-label" htmlFor="holiday-desc">Description</label>
          <textarea
            id="holiday-desc"
            className={`hf-textarea ${errors.description ? 'error' : ''}`}
            placeholder="Optional description for this holiday..."
            rows={3}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            aria-describedby={errors.description ? 'hf-desc-error' : undefined}
          />
          {errors.description && (
            <span className="hf-err-text" id="hf-desc-error" role="alert">{errors.description}</span>
          )}
        </div>

        <div className="hf-group hf-full">
          <label className="hf-checkbox">
            <input
              type="checkbox"
              checked={isRecurringYearly}
              onChange={(e) => setIsRecurringYearly(e.target.checked)}
              disabled={loading}
            />
            <span>
              <span className="hf-checkbox-label">Recurring Yearly</span>
              <span className="hf-checkbox-hint">
                Repeats every year automatically
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="hf-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading && <Loader2 size={16} className="spin" />}
          {isEdit ? 'Update Holiday' : 'Add Holiday'}
        </button>
      </div>
    </form>
  );
};

export default HolidayForm;
