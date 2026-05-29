import { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import leaveService, {
  type Leave,
  type LeaveType,
  type LeaveBalance
} from '../../../services/leave.service';
import { calculateWorkingDays, isWeekend } from '../../../lib/date';
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
  const initialLeaveIdRef = useRef(initialLeave?.id ?? null);
  const submittedRef = useRef(false);
  const isEditMode = Boolean(initialLeave);
  const isReadOnly = Boolean(initialLeave && initialLeave.status !== 'Pending');
  const [leaveType, setLeaveType] = useState<LeaveType>(initialLeave?.leaveType || 'CL');
  const [dayType, setDayType] = useState<string>(initialLeave?.dayType || 'Full-day');
  const [fromDate, setFromDate] = useState<string>(toDateInputValue(initialLeave?.fromDate));
  const [toDate, setToDate] = useState<string>(toDateInputValue(initialLeave?.toDate));
  const [reason, setReason] = useState<string>(initialLeave?.reason || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialLeave?.id && initialLeave.id === initialLeaveIdRef.current) return;
    initialLeaveIdRef.current = initialLeave?.id ?? null;
    setLeaveType(initialLeave?.leaveType || 'CL');
    setDayType(initialLeave?.dayType || 'Full-day');
    setFromDate(toDateInputValue(initialLeave?.fromDate));
    setToDate(toDateInputValue(initialLeave?.toDate));
    setReason(initialLeave?.reason || '');
    setErrors({});
    submittedRef.current = false;
  }, [initialLeave?.id]);

  const workingDays = useMemo(() => {
    if (!fromDate || !toDate) return 0;
    if (dayType === 'Full-day') {
      return calculateWorkingDays(fromDate, toDate);
    }
    if (fromDate !== toDate) return 0;
    const [y, m, d] = fromDate.split('-').map(Number);
    const wknd = isWeekend(y, m, d);
    return wknd ? 0 : 0.5;
  }, [fromDate, toDate, dayType]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!fromDate) newErrors.fromDate = 'From date is required';
    if (!toDate) newErrors.toDate = 'To date is required';

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
    if (submittedRef.current) return;
    submittedRef.current = true;

    setLoading(true);
    try {
      const payload = {
        leaveType,
        fromDate,
        toDate,
        dayType,
        reason: reason.trim()
      };

      if (initialLeave) {
        await leaveService.updateLeave(initialLeave.id, payload);
      } else {
        await leaveService.applyLeave(payload);
      }

      addToast(`Leave request ${isEditMode ? 'updated' : 'submitted'} successfully`, 'success');
      onSubmitSuccess();
    } catch {
      submittedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="leave-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="leave-type">Leave Type</label>
          <select
            id="leave-type"
            className={`form-select ${errors.leaveType ? 'error' : ''}`}
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
            disabled={isReadOnly || loading}
            aria-describedby={errors.leaveType ? 'leave-type-error' : undefined}
          >
            <option value="CL">Casual Leave (CL)</option>
            <option value="SL">Sick Leave (SL)</option>
            <option value="PL">Paid Leave (PL)</option>
            <option value="LOP">Loss Of Pay (LOP)</option>
          </select>
          {errors.leaveType && (
            <span className="error-text" id="leave-type-error" role="alert">
              <AlertCircle size={14} />
              {errors.leaveType}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="day-type">Day Type</label>
          <select
            id="day-type"
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
          <label className="form-label" htmlFor="from-date">From Date</label>
          <div className="date-input-wrapper">
            <input
              id="from-date"
              type="date"
              className={`form-input ${errors.fromDate ? 'error' : ''}`}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              disabled={isReadOnly || loading}
              aria-describedby={errors.fromDate ? 'from-date-error' : undefined}
            />
            <Calendar size={18} className="calendar-icon" />
          </div>
          {errors.fromDate && (
            <span className="error-text" id="from-date-error" role="alert">
              <AlertCircle size={14} />
              {errors.fromDate}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="to-date">To Date</label>
          <div className="date-input-wrapper">
            <input
              id="to-date"
              type="date"
              className={`form-input ${errors.toDate ? 'error' : ''}`}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              disabled={isReadOnly || loading}
              aria-describedby={errors.toDate ? 'to-date-error' : undefined}
            />
            <Calendar size={18} className="calendar-icon" />
          </div>
          {errors.toDate && (
            <span className="error-text" id="to-date-error" role="alert">
              <AlertCircle size={14} />
              {errors.toDate}
            </span>
          )}
        </div>

        <div className="form-group full-width">
          <label className="form-label" htmlFor="leave-reason">Reason</label>
          <textarea
            id="leave-reason"
            className={`form-textarea ${errors.reason ? 'error' : ''}`}
            placeholder="Please enter details or reasons for leave..."
            rows={4}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isReadOnly || loading}
            aria-describedby={errors.reason ? 'reason-error' : undefined}
          />
          {errors.reason && (
            <span className="error-text" id="reason-error" role="alert">
              <AlertCircle size={14} />
              {errors.reason}
            </span>
          )}
        </div>
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
