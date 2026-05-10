import React from 'react';
import { LogIn, LogOut, Clock } from 'lucide-react';
import './AttendanceCard.css';

interface AttendanceCardProps {
  status: 'not_checked_in' | 'checked_in' | 'checked_out';
  checkInTime?: string;
  checkOutTime?: string;
  hoursWorked?: string;
  onCheckIn: () => void;
  onCheckOut: () => void;
  loading?: boolean;
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({ 
  status, 
  checkInTime, 
  checkOutTime, 
  hoursWorked,
  onCheckIn,
  onCheckOut,
  loading
}) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'not_checked_in':
        return { label: 'Not Checked In', color: 'gray' };
      case 'checked_in':
        return { label: 'Working', color: 'green' };
      case 'checked_out':
        return { label: 'Completed', color: 'blue' };
      default:
        return { label: 'Unknown', color: 'gray' };
    }
  };

  const display = getStatusDisplay();

  return (
    <div className="attendance-action-card">
      <div className="card-header">
        <div className="title-area">
          <h3>Today's Attendance</h3>
          <span className="current-date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        <div className={`status-pill ${display.color}`}>
          {display.label}
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-icon checkin">
            <LogIn size={18} />
          </div>
          <div className="stat-info">
            <span className="label">Check In</span>
            <span className="value">{checkInTime || '--:--'}</span>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon checkout">
            <LogOut size={18} />
          </div>
          <div className="stat-info">
            <span className="label">Check Out</span>
            <span className="value">{checkOutTime || '--:--'}</span>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon total">
            <Clock size={18} />
          </div>
          <div className="stat-info">
            <span className="label">Total Hours</span>
            <span className="value">{hoursWorked || '0h 0m'}</span>
          </div>
        </div>
      </div>

      <div className="action-area">
        {status === 'not_checked_in' && (
          <button 
            className="btn-primary check-in" 
            onClick={onCheckIn}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Check In Now'}
          </button>
        )}
        
        {status === 'checked_in' && (
          <button 
            className="btn-primary check-out" 
            onClick={onCheckOut}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Check Out Now'}
          </button>
        )}

        {status === 'checked_out' && (
          <div className="attendance-completed">
            <div className="success-icon">✓</div>
            <span>Attendance completed for today</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceCard;
