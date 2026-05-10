import api from '../lib/api';

export interface AttendanceRecord {
  id: string;
  employee: {
    id: string;
    fullName: string;
    employeeId: string;
    department: string;
  };
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'Present' | 'Absent' | 'Half-day' | 'Leave' | 'Weekend';
  hoursWorked?: number;
  workMode?: 'Office' | 'Remote';
  notes?: string;
}

export interface AttendanceSummary {
  presentToday: number;
  onLeave: number;
  attendanceRate: number;
  absentCount: number;
}

export interface AttendanceFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  department?: string;
  search?: string;
}

const attendanceService = {
  // Self Attendance
  checkIn: async () => {
    const response = await api.post('/api/attendance/check-in');
    return response.data;
  },

  checkOut: async () => {
    const response = await api.post('/api/attendance/check-out');
    return response.data;
  },

  // Management
  getAttendance: async (params: AttendanceFilters = {}) => {
    const response = await api.get('/api/attendance', { params });
    return response.data;
  },

  getAttendanceById: async (id: string) => {
    const response = await api.get(`/api/attendance/${id}`);
    return response.data;
  },

  getMyAttendance: async (params: { month?: number; year?: number; startDate?: string; endDate?: string } = {}) => {
    const response = await api.get('/api/attendance/me', { params });
    return response.data;
  },

  markManualAttendance: async (data: any) => {
    const response = await api.post('/api/attendance/manual', data);
    return response.data;
  },

  updateAttendance: async (id: string, data: any) => {
    const response = await api.put(`/api/attendance/${id}`, data);
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/api/attendance/summary');
    return response.data.data;
  },

  exportCsv: async (params: AttendanceFilters = {}) => {
    const response = await api.get('/api/attendance/export/csv', { 
      params,
      responseType: 'blob' 
    });

    const contentDisposition = response.headers['content-disposition'];
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || `attendance_report_${new Date().toISOString().split('T')[0]}.csv`
      : `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;

    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export default attendanceService;
