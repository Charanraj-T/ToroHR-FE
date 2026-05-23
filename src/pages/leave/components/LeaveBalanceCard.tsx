import { Sun, HeartPulse, ShieldAlert, CircleDollarSign } from 'lucide-react';
import type { LeaveType } from '../../../services/leave.service';
import './LeaveBalanceCard.css';

interface LeaveBalanceCardProps {
  type: LeaveType;
  balance: number | null | undefined;
}

const LeaveBalanceCard = ({ type, balance }: LeaveBalanceCardProps) => {
  const isUnavailable = balance === null || balance === undefined;

  const getCardDetails = () => {
    if (isUnavailable) {
      return {
        title: type === 'CL' ? 'CASUAL LEAVE' : type === 'SL' ? 'SICK LEAVE' : type === 'PL' ? 'PAID LEAVE' : 'LOSS OF PAY',
        icon: type === 'CL' ? Sun : type === 'SL' ? HeartPulse : type === 'PL' ? ShieldAlert : CircleDollarSign,
        iconClass: `icon-${type.toLowerCase()}` as const,
        progressClass: `progress-${type.toLowerCase()}` as const,
        percent: 0,
        label: 'Unavailable',
        displayValue: '--'
      };
    }

    switch (type) {
      case 'CL':
        return {
          title: 'CASUAL LEAVE',
          icon: Sun,
          iconClass: 'icon-cl',
          progressClass: 'progress-cl',
          percent: Math.min(100, Math.max(0, (balance / 12) * 100)),
          label: 'Days Available',
          displayValue: String(balance).padStart(2, '0')
        };
      case 'SL':
        return {
          title: 'SICK LEAVE',
          icon: HeartPulse,
          iconClass: 'icon-sl',
          progressClass: 'progress-sl',
          percent: Math.min(100, Math.max(0, (balance / 12) * 100)),
          label: 'Days Available',
          displayValue: String(balance).padStart(2, '0')
        };
      case 'PL':
        return {
          title: 'PAID LEAVE',
          icon: ShieldAlert,
          iconClass: 'icon-pl',
          progressClass: 'progress-pl',
          percent: Math.min(100, Math.max(0, (balance / 12) * 100)),
          label: 'Days Available',
          displayValue: String(balance).padStart(2, '0')
        };
      case 'LOP':
        return {
          title: 'LOSS OF PAY',
          icon: CircleDollarSign,
          iconClass: 'icon-lop',
          progressClass: 'progress-lop',
          percent: Math.min(100, (balance / 10) * 100),
          label: 'Days This Year',
          displayValue: String(balance).padStart(2, '0')
        };
      default:
        return {
          title: 'UNKNOWN',
          icon: Sun,
          iconClass: 'icon-cl',
          progressClass: 'progress-cl',
          percent: 0,
          label: 'Days Available',
          displayValue: '00'
        };
    }
  };

  const details = getCardDetails();
  const IconComponent = details.icon;

  return (
    <div className={`leave-balance-card ${isUnavailable ? 'card-unavailable' : ''}`}>
      <div className="card-header-row">
        <span className="card-title">{details.title}</span>
        <div className={`card-icon-wrapper ${details.iconClass}`}>
          <IconComponent size={18} />
        </div>
      </div>
      <div className="card-body-row">
        <h2 className="card-value">{details.displayValue}</h2>
        <span className="card-label">{details.label}</span>
      </div>
      {!isUnavailable && (
        <div className="card-progress-container">
          <div 
            className={`card-progress-bar ${details.progressClass}`} 
            style={{ width: `${details.percent}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default LeaveBalanceCard;
