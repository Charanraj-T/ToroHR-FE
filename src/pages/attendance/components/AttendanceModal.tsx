import React, { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import { FormField } from '../../../components/ui/FormFields';
import './AttendanceModal.css';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  employeeName: string;
  date: string;
  initialData?: any;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employeeName,
  date,
  initialData
}) => {
  const [formData, setFormData] = useState({
    checkInTime: initialData?.checkInTime || '',
    checkOutTime: initialData?.checkOutTime || '',
    status: initialData?.status || 'Present'
  });

  // Update form data when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        checkInTime: initialData.checkInTime || '',
        checkOutTime: initialData.checkOutTime || '',
        status: initialData.status || 'Present'
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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
              value={formData.status}
              onChange={(e) => {
                const s = e.target.value;
                if (s === 'Absent' || s === 'Leave') {
                  setFormData({ ...formData, status: s, checkInTime: '', checkOutTime: '' });
                } else {
                  setFormData({ ...formData, status: s });
                }
              }}
              required
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Half-day">Half-day</option>
              <option value="Leave">On Leave</option>
            </select>
          </FormField>

          <FormField label="Check In Time">
            <input 
              type="time" 
              value={formData.checkInTime}
              onChange={(e) => setFormData({...formData, checkInTime: e.target.value})}
              disabled={formData.status === 'Absent' || formData.status === 'Leave'}
            />
          </FormField>

          <FormField label="Check Out Time">
            <input 
              type="time" 
              value={formData.checkOutTime}
              onChange={(e) => setFormData({...formData, checkOutTime: e.target.value})}
              disabled={formData.status === 'Absent' || formData.status === 'Leave'}
            />
          </FormField>
        </div>

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
