import React from 'react';
import './StatusBadge.css';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalizedStatus = status.toLowerCase();
  
  return (
    <span className={`status-badge ${normalizedStatus}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
