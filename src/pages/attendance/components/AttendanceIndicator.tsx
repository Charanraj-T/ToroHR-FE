import React from 'react';
import './AttendanceIndicator.css';

interface AttendanceIndicatorProps {
  status: 'Present' | 'Absent' | 'Leave' | 'Weekend' | 'Half-day' | 'Holiday' | 'N/A';
  size?: 'sm' | 'md';
  onClick?: () => void;
}

const AttendanceIndicator: React.FC<AttendanceIndicatorProps> = ({ status, size = 'md', onClick }) => {
  if (status === 'Weekend' || status === 'Holiday') {
    return (
      <div className={`indicator-wrapper ${size}`} onClick={onClick}>
        <span className="indicator-text holiday">H</span>
      </div>
    );
  }

  if (status === 'N/A' || !status) {
    return (
      <div className={`indicator-wrapper ${size}`} onClick={onClick}>
        <div className="indicator-dot empty"></div>
      </div>
    );
  }

  return (
    <div className={`indicator-wrapper ${size}`} onClick={onClick}>
      <div className={`indicator-dot ${status.toLowerCase().replace('-', '')}`} title={status}></div>
    </div>
  );
};

export default AttendanceIndicator;
