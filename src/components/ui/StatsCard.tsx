import React from 'react';
import './StatsCard.css';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  variant?: 'dark' | 'green' | 'blue' | 'white';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, variant = 'white' }) => {
  return (
    <div className={`stats-card ${variant}`}>
      <div className="stats-content">
        <span className="stats-title">{title}</span>
        <span className="stats-value">{value}</span>
      </div>
      {icon && <div className="stats-icon">{icon}</div>}
    </div>
  );
};

export default StatsCard;
