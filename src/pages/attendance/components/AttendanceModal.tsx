import React, { useMemo, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import { FormField } from '../../../components/ui/FormFields';
import { Plus, Trash2, Clock } from 'lucide-react';
import type { AttendancePunch } from '../../../services/attendance.service';
import './AttendanceModal.css';

export interface AttendanceFormData {
  status: string;
  punches: AttendancePunch[];
}

interface AttendanceInitialData {
  status?: string;
  checkInTime?: string;
  checkOutTime?: string;
  punches?: AttendancePunch[];
  id?: string | null;
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AttendanceFormData) => void;
  employeeName: string;
  date: string;
  initialData?: AttendanceInitialData;
}

const NO_PUNCH_STATUSES = ['Absent', 'Leave', 'Half-day'];

type PunchFormState = { checkInTime: string; checkOutTime: string };

const toPunchList = (initialData?: AttendanceInitialData): PunchFormState[] => {
  if (initialData?.punches && initialData.punches.length > 0) {
    return initialData.punches.map((p) => ({
      checkInTime: p.checkInTime || '',
      checkOutTime: p.checkOutTime || ''
    }));
  }
  const single = [
    {
      checkInTime: initialData?.checkInTime || '',
      checkOutTime: initialData?.checkOutTime || ''
    }
  ];
  return single[0].checkInTime || single[0].checkOutTime ? single : [];
};

const toHours = (time: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h + m / 60;
};

const formatDuration = (hours: number): string => {
  if (hours <= 0) return '0h 0m';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employeeName,
  date,
  initialData
}) => {
  const [status, setStatus] = useState<string>(initialData?.status || 'Present');
  const [punches, setPunches] = useState<PunchFormState[]>(() => toPunchList(initialData));

  const punchesDisabled = NO_PUNCH_STATUSES.includes(status);

  const totalHours = useMemo(() => {
    return punches.reduce((sum, p) => {
      if (!p.checkInTime || !p.checkOutTime) return sum;
      const diff = toHours(p.checkOutTime) - toHours(p.checkInTime);
      return sum + (diff > 0 ? diff : 0);
    }, 0);
  }, [punches]);

  const handleStatusChange = (s: string) => {
    setStatus(s);
    if (NO_PUNCH_STATUSES.includes(s)) {
      setPunches([]);
    }
  };

  const updatePunch = (index: number, field: keyof PunchFormState, value: string) => {
    setPunches((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const addPunch = () => {
    setPunches((prev) => [...prev, { checkInTime: '', checkOutTime: '' }]);
  };

  const removePunch = (index: number) => {
    setPunches((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validPunches: AttendancePunch[] = punches
      .filter((p) => p.checkInTime)
      .map((p) => ({
        checkInTime: p.checkInTime || '',
        checkOutTime: p.checkOutTime || ''
      }));
    onSubmit({ status, punches: validPunches });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Attendance Update"
    >
      <form onSubmit={handleSubmit} className="manual-attendance-form">
        <div className="info-section">
          <div className="info-item">
            <span className="label">Employee</span>
            <span className="value">{employeeName}</span>
          </div>
          <div className="info-item">
            <span className="label">Date</span>
            <span className="value">{date}</span>
          </div>
        </div>

        <div className="form-grid">
          <FormField label="Status">
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              required
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Half-day">Half-day</option>
              <option value="Leave">On Leave</option>
            </select>
          </FormField>
        </div>

        {punchesDisabled ? (
          <div className="punches-empty-note">
            Check-in / check-out sessions are not applicable for this status.
          </div>
        ) : (
          <div className="punches-section">
            <div className="punches-header">
              <span className="punches-title">Check-in / Check-out Sessions</span>
              <button type="button" className="btn-secondary sm" onClick={addPunch}>
                <Plus size={14} /> Add Session
              </button>
            </div>

            {punches.length === 0 ? (
              <div className="punches-empty">
                No sessions added. Click "Add Session" to record check-in / check-out times.
              </div>
            ) : (
              <div className="punches-list">
                {punches.map((punch, index) => {
                  const duration =
                    punch.checkInTime && punch.checkOutTime
                      ? toHours(punch.checkOutTime) - toHours(punch.checkInTime)
                      : 0;
                  return (
                    <div key={index} className="punch-row">
                      <span className="punch-index">#{index + 1}</span>
                      <div className="punch-fields">
                        <FormField label="Check In">
                          <input
                            type="time"
                            value={punch.checkInTime}
                            onChange={(e) => updatePunch(index, 'checkInTime', e.target.value)}
                          />
                        </FormField>
                        <FormField label="Check Out">
                          <input
                            type="time"
                            value={punch.checkOutTime}
                            onChange={(e) => updatePunch(index, 'checkOutTime', e.target.value)}
                          />
                        </FormField>
                      </div>
                      <span className="punch-duration">
                        <Clock size={14} /> {duration > 0 ? formatDuration(duration) : '--:--'}
                      </span>
                      <button
                        type="button"
                        className="punch-remove"
                        onClick={() => removePunch(index)}
                        aria-label={`Remove session ${index + 1}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {punches.length > 0 && (
              <div className="punches-total">
                <span>Total Hours Worked</span>
                <strong>{formatDuration(totalHours)}</strong>
              </div>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AttendanceModal;
