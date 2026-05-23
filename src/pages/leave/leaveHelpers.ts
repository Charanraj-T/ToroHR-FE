import type { LeaveType } from '../../services/leave.service';

export const getLeaveTypeDetails = (type: LeaveType): { name: string; color: string } => {
  switch (type) {
    case 'CL': return { name: 'Casual Leave', color: '#15803d' };
    case 'SL': return { name: 'Sick Leave', color: '#b91c1c' };
    case 'PL': return { name: 'Paid Leave', color: '#1d4ed8' };
    case 'LOP': return { name: 'Loss Of Pay', color: '#b45309' };
    default: return { name: type, color: '#64748b' };
  }
};

export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
