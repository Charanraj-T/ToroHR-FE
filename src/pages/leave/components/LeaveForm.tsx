import { useState, useEffect } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import leaveService, { 
  type Leave,
  type LeaveType, 
  type LeaveBalance, 
  calculateWorkingDays 
} from '../../../services/leave.service';
import { useToastStore } from '../../../store/toastStore';
import './LeaveForm.css';

interface LeaveFormProps {
  balances: LeaveBalance | null;
  initialLeave?: Leave | null;
  onSubmitSuccess: () => void;
  onCancel: () => void;
}

const toDateInputValue = (value?: string) => {
  if (!value) return '';
  return value.split('T')[0];
};

const LeaveForm = ({ balances, initialLeave = null, onSubmitSuccess, onCancel }: LeaveFormProps) => {
  const { addToast } = useToastStore();
  const isEditMode = Boolean(initialLeave);
  const isReadOnly = Boolean(initialLeave && initialLeave.status !== 'Pending');
  const [leaveType, setLeaveType] = useState<LeaveType>(initialLeave?.leaveType || 'CL');
  const [dayType, setDayType] = useState<string>(initialLeave?.dayType || 'Full-day');
  const [halfDayPeriod, setHalfDayPeriod] = useState<string>(initialLeave?.halfDayPeriod || '');
  const [fromDate, setFromDate] = useState<string>(toDateInputValue(initialLeave?.fromDate));
  const [toDate, setToDate] = useState<string>(toDateInputValue(initialLeave?.toDate));
  const [reason, setReason] = useState<string>(initialLeave?.reason || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [workingDays, setWorkingDays] = useState<number>(0);

  useEffect(() => {
    setLeaveType(initialLeave?.leaveType || 'CL');
    setDayType(initialLeave?.dayType || 'Full-day');
    setHalfDayPeriod(initialLeave?.halfDayPeriod || '');
    setFromDate(toDateInputValue(initialLeave?.fromDate));
    setToDate(toDateInputValue(initialLeave?.toDate));
    setReason(initialLeave?.reason || '');
    setErrors({});
  }, [initialLeave]);

  useEffect(() => {
    if (fromDate && toDate) {
      if (dayType === 'Full-day') {
        const days = calculateWorkingDays(fromDate, toDate);
        setWorkingDays(days);
      } else {
        const same = fromDate === toDate;
        if (same) {
          const d = new Date(fromDate + 'T00:00:00.000Z');
          const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
          setWorkingDays(isWeekend ? 0 : 0.5);
        } else {
          setWorkingDays(0);
        }
      }
    } else {
      setWorkingDays(0);
    }
  }, [fromDate, toDate, dayType]);

  useEffect(() => {
    if (dayType !== 'Half-day') {
      setHalfDayPeriod('');
    }
  }, [dayType]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!fromDate) newErrors.fromDate = 'From date is required';
    if (!toDate) newErrors.toDate = 'To date is required';

    if (dayType === 'Half-day' && !halfDayPeriod) {
      newErrors.halfDayPeriod = 'Please select a half-day period';
    }

    if (fromDate && toDate) {
      const start = new Date(fromDate + 'T00:00:00.000Z');
      const end = new Date(toDate + 'T00:00:00.000Z');
      if (start > end) {
        newErrors.toDate = 'To date cannot be before From date';
      } else if (dayType === 'Half-day' && fromDate !== toDate) {
        newErrors.toDate = 'Half-day leave must start and end on the same date';
      } else if (workingDays === 0) {
        newErrors.toDate = 'Selected range contains no working days (weekends only)';
      }
    }

    if (reason && reason.trim().length > 500) {
      newErrors.reason = 'Reason cannot exceed 500 characters';
    }

    if (balances && leaveType !== 'LOP') {
      const currentBalance = balances[leaveType] || 0;
      if (workingDays > currentBalance) {
        newErrors.leaveType = `Insufficient ${leaveType} balance. Available: ${currentBalance} days, Required: ${workingDays} days.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        leaveType,
        fromDate,
        toDate,
        dayType,
        halfDayPeriod: halfDayPeriod || undefined,
        reason: reason.trim()
      };

      if (initialLeave) {
        await leaveService.updateLeave(initialLeave.id, payload);
      } else {
        await leaveService.applyLeave(payload);
      }

      addToast(`Leave request ${isEditMode ? 'updated' : 'submitted'} successfully`, 'success');
      onSubmitSuccess();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'submit'} leave request`;
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const preview = { current: 0, after: 0 };

  return (
    <form className="leave-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Leave Type</label>
          <select 
            className={`form-select ${errors.leaveType ? 'error' : ''}`}
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
            disabled={isReadOnly || loading}
          >
            <option value="CL">Casual Leave (CL)</option>
            <option value="SL">Sick Leave (SL)</option>
            <option value="PL">Paid Leave (PL)</option>
            <option value="LOP">Loss Of Pay (LOP)</option>
          </select>
          {errors.leaveType && (
            <span className="error-text">
              <AlertCircle size={14} />
              {errors.leaveType}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Day Type</label>
          <select
            className="form-select"
            value={dayType}
            onChange={(e) => setDayType(e.target.value)}
            disabled={isReadOnly || loading}
          >
            <option value="Full-day">Full Day</option>
            <option value="Half-day">Half Day</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">From Date</label>
          <div className="date-input-wrapper">
            <input 
              type="date" 
              className={`form-input ${errors.fromDate ? 'error' : ''}`}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              disabled={isReadOnly || loading}
            />
            <Calendar size={18} className="calendar-icon" />
          </div>
          {errors.fromDate && (
            <span className="error-text">
              <AlertCircle size={14} />
              {errors.fromDate}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">To Date</label>
          <div className="date-input-wrapper">
            <input 
              type="date" 
              className={`form-input ${errors.toDate ? 'error' : ''}`}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              disabled={isReadOnly || loading}
            />
            <Calendar size={18} className="calendar-icon" />
          </div>
          {errors.toDate && (
            <span className="error-text">
              <AlertCircle size={14} />
              {errors.toDate}
            </span>
          )}
        </div>

        {dayType === 'Half-day' && (
          <div className="form-group">
            <label className="form-label">Half Day Period</label>
            <select
              className={`form-select ${errors.halfDayPeriod ? 'error' : ''}`}
              value={halfDayPeriod}
              onChange={(e) => setHalfDayPeriod(e.target.value)}
              disabled={isReadOnly || loading}
            >
              <option value="">Select period</option>
              <option value="First-half">First Half</option>
              <option value="Second-half">Second Half</option>
            </select>
            {errors.halfDayPeriod && (
              <span className="error-text">
                <AlertCircle size={14} />
                {errors.halfDayPeriod}
              </span>
            )}
          </div>
        )}

        <div className="form-group full-width">
          <label className="form-label">Reason</label>
          <textarea 
            className={`form-textarea ${errors.reason ? 'error' : ''}`}
            placeholder="Please enter details or reasons for leave..."
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isReadOnly || loading}
          />
          {errors.reason && (
            <span className="error-text">
              <AlertCircle size={14} />
              {errors.reason}
            </span>
          )}
        </div>

        {false && fromDate && toDate && !errors.fromDate && !errors.toDate && (
          <div className="preview-box full-width">
            <div className="preview-row">
              <span className="preview-label">Requested Duration:</span>
              <span className="preview-value highlight">
                {workingDays} {workingDays === 1 ? 'Working Day' : 'Working Days'}
                <span className="preview-subtext">
                  {dayType === 'Half-day' ? ' (half day)' : ' (excludes weekends)'}
                </span>
              </span>
            </div>
            {preview && (
              <div className="preview-row border-top">
                <span className="preview-label">{leaveType} Balance Preview:</span>
                <div className="balance-preview-steps">
                  <span>Current: <strong>{preview.current}</strong></span>
                  <span className="arrow">→</span>
                  <span>After request: <strong className={leaveType === 'LOP' ? 'text-danger' : 'text-success'}>{preview.after}</strong></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button 
          type="button" 
          className="btn-secondary" 
          onClick={onCancel}
          disabled={loading}
        >
          {isReadOnly ? 'Close' : 'Cancel'}
        </button>
        {!isReadOnly && (
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner spin"></span> Submitting...
              </>
            ) : isEditMode ? 'Update Request' : 'Submit Request'}
          </button>
        )}
      </div>
    </form>
  );
};

export default LeaveForm;
