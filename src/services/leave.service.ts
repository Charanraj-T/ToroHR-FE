import api from '../lib/api';

export interface EmployeeBrief {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  department?: string;
  designation?: string;
  reportingManagerId?: string;
}

export type LeaveType = 'CL' | 'SL' | 'PL' | 'LOP';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface Leave {
  id: string;
  employee: EmployeeBrief;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  leaveDays: number;
  dayType?: string;
  halfDayPeriod?: string;
  reason?: string;
  status: LeaveStatus;
  appliedBy: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  year: number;
  CL: number;
  SL: number;
  PL: number;
  LOP: number;
  lastResetAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveFilters {
  page?: number;
  limit?: number;
  employee?: string;
  leaveType?: string;
  status?: string;
  manager?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  search?: string;
}

export interface LeaveRequestPayload {
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  dayType?: string;
  halfDayPeriod?: string;
  reason?: string;
}

export const calculateWorkingDays = (fromDateStr: string, toDateStr: string): number => {
  if (!fromDateStr || !toDateStr) return 0;

  const start = new Date(`${fromDateStr}T00:00:00.000Z`);
  const end = new Date(`${toDateStr}T00:00:00.000Z`);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return 0;
  }

  let count = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    const dayOfWeek = cursor.getUTCDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return count;
};

const leaveService = {
  getMyLeaves: async (params: LeaveFilters = {}) => {
    const response = await api.get('/api/leaves/me', { params });
    return response.data;
  },

  getMyLeaveBalance: async () => {
    const response = await api.get('/api/leaves/balance/me');
    return response.data.data.balance as LeaveBalance;
  },

  getLeaves: async (params: LeaveFilters = {}) => {
    const response = await api.get('/api/leaves', { params });
    return response.data;
  },

  getLeaveById: async (id: string) => {
    const response = await api.get(`/api/leaves/${id}`);
    return response.data.data.leave as Leave;
  },

  applyLeave: async (data: LeaveRequestPayload) => {
    const response = await api.post('/api/leaves', data);
    return response.data;
  },

  updateLeave: async (id: string, data: LeaveRequestPayload) => {
    const response = await api.put(`/api/leaves/${id}`, data);
    return response.data;
  },

  approveLeave: async (id: string) => {
    const response = await api.put(`/api/leaves/${id}/approve`);
    return response.data;
  },

  rejectLeave: async (id: string, data: { rejectionReason: string }) => {
    const response = await api.put(`/api/leaves/${id}/reject`, data);
    return response.data;
  },

  cancelLeave: async (id: string, data: { cancellationReason: string }) => {
    const response = await api.put(`/api/leaves/${id}/cancel`, data);
    return response.data;
  }
};

export default leaveService;
