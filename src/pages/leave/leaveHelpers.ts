export const getLeaveTypeDetails = (type: string) => {
  switch (type) {
    case 'CL': return { name: 'Casual Leave', color: '#15803d' };
    case 'SL': return { name: 'Sick Leave', color: '#b91c1c' };
    case 'PL': return { name: 'Paid Leave', color: '#1d4ed8' };
    case 'LOP': return { name: 'Loss Of Pay', color: '#b45309' };
    default: return { name: type, color: '#64748b' };
  }
};

export const getLeaveTypeLabel = (type: string) => {
  switch (type) {
    case 'CL': return 'Casual Leave';
    case 'SL': return 'Sick Leave';
    case 'PL': return 'Paid Leave';
    case 'LOP': return 'Loss Of Pay';
    default: return type;
  }
};

export const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};
