import api from '../lib/api';

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  joiningDate: string;
  department: string;
  designation: string;
  employmentType: 'Full-time' | 'Contract';
  status: 'Active' | 'Inactive';
  reportingManager?: string | { id: string; fullName: string; employeeId: string };
  role: 'Manager' | 'Employee';
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  password?: string;
}

export interface EmployeeFilters {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  status?: string;
  manager?: string;
}

const employeeService = {
  getEmployees: async (params: EmployeeFilters = {}) => {
    const response = await api.get('/api/employees', { params });
    return response.data;
  },

  getEmployeeById: async (id: string) => {
    const response = await api.get(`/api/employees/${id}`);
    return response.data;
  },

  createEmployee: async (data: Partial<Employee>) => {
    const response = await api.post('/api/employees', data);
    return response.data;
  },

  updateEmployee: async (id: string, data: Partial<Employee>) => {
    const response = await api.put(`/api/employees/${id}`, data);
    return response.data;
  },

  deleteEmployee: async (id: string) => {
    const response = await api.delete(`/api/employees/${id}`);
    return response.data;
  },

  getManagers: async () => {
    const response = await api.get('/api/employees', { params: { role: 'Manager', limit: 100 } });
    return response.data.data;
  },

  getStats: async (params: { manager?: string } = {}) => {
    const response = await api.get('/api/employees/stats', { params });
    return response.data.data;
  }
};

export default employeeService;
