import React from 'react';
import './StatsCard.css';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  variant?: 'dark' | 'green' | 'blue' | 'white' | 'red';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, variant = 'white' }) => {
  return (
    <div className={`stats-card ${variant}`}>
      {icon && <div className="stats-icon-box">{icon}</div>}
      <div className="stats-content">
        <span className="stats-title">{title}</span>
        <h2 className="stats-value">{value}</h2>
      </div>
    </div>
  );
};

export default StatsCard;
