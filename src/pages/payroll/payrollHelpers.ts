import type { Payroll } from '../../services/payroll.service';
import { getTodayIST } from '../../lib/date';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const formatMonthYear = (month: number, year: number) =>
  `${MONTH_NAMES[month - 1] || month} ${year}`;

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);

export const getNetPay = (payroll: Payroll) => {
  const snapshot = payroll.salarySnapshot;
  if (payroll.employmentType === 'Contract' && 'totalPay' in snapshot) {
    return snapshot.totalPay ?? 0;
  }
  if ('netPay' in snapshot) {
    return snapshot.netPay ?? 0;
  }
  return 0;
};

export const getCurrentYearMonth = () => {
  const { year, month } = getTodayIST();
  return { month, year };
};

export const buildYearOptions = (range = 5) => {
  const currentYear = getTodayIST().year;
  return Array.from({ length: range * 2 + 1 }, (_, i) => currentYear - range + i);
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
