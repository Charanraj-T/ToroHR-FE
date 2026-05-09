import React from 'react';
import './StatusBadge.css';

interface StatusBadgeProps {
  status: 'Active' | 'Inactive' | string;
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
