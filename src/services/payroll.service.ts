import api from '../lib/api';
import type { EmployeeBrief } from './leave.service';

export type PayrollStatus = 'Draft' | 'Processed' | 'Paid';
export type EmploymentType = 'Full-time' | 'Contract';

export interface AttendanceSnapshot {
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  holidayDays: number;
  lopDays: number;
}

export interface FullTimeSalarySnapshot {
  basic: number;
  houseRentAllowance: number;
  specialAllowance: number;
  gross: number;
  pf: number;
  lopDeduction: number;
  netPay: number;
}

interface ContractSalarySnapshot {
  dailyAmount: number;
  payableDays: number;
  totalPay: number;
}

export interface CompanySnapshot {
  companyName: string;
  logo?: string;
  address?: string;
}

export interface Payroll {
  id: string;
  payrollNumber: string;
  employee?: EmployeeBrief;
  employeeName: string;
  employeeCode: string;
  designation: string;
  employmentType: EmploymentType;
  month: number;
  year: number;
  companySnapshot: CompanySnapshot;
  attendanceSnapshot: AttendanceSnapshot;
  salarySnapshot: FullTimeSalarySnapshot | ContractSalarySnapshot;
  status: PayrollStatus;
  processedAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollSummary {
  Draft: number;
  Processed: number;
  Paid: number;
}

export interface PayrollFilters {
  page?: number;
  limit?: number;
  month?: number | string;
  year?: number | string;
  employee?: string;
  status?: string;
}

export interface PaginatedPayrollResponse {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  data: Payroll[];
}

export interface GeneratePayrollPayload {
  month: number;
  year: number;
}

export interface RegeneratePayrollPayload {
  month: number;
  year: number;
}

export interface PaginatedSalaryStructureResponse {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  data: SalaryStructure[];
}

export interface SalaryStructure {
  id: string;
  employee: EmployeeBrief & { employmentType?: EmploymentType };
  employmentType: EmploymentType;
  effectiveMonth: number;
  effectiveYear: number;
  basic?: number;
  houseRentAllowance?: number;
  specialAllowance?: number;
  gross?: number;
  pf?: number | null;
  dailyAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryStructurePayload {
  employeeId: string;
  employmentType: EmploymentType;
  effectiveMonth: number;
  effectiveYear: number;
  basic?: number;
  houseRentAllowance?: number;
  specialAllowance?: number;
  pf?: number | null;
  dailyAmount?: number;
}

export interface PayrollSettings {
  id: string;
  payrollGenerationDay: number;
  defaultPF: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GeneratePayrollResult {
  generatedCount: number;
  skippedCount: number;
  warnings: string[];
}

const payrollService = {
  getPayroll: async (params: PayrollFilters = {}): Promise<PaginatedPayrollResponse> => {
    const response = await api.get('/api/payroll', { params });
    return response.data;
  },

  getPayrollSummary: async (): Promise<PayrollSummary> => {
    const response = await api.get('/api/payroll/summary');
    return response.data?.data?.summary ?? { Draft: 0, Processed: 0, Paid: 0 };
  },

  getMyPayslips: async (params: PayrollFilters = {}): Promise<PaginatedPayrollResponse> => {
    const response = await api.get('/api/payroll/me', { params });
    return response.data;
  },

  generatePayroll: async (data: GeneratePayrollPayload): Promise<GeneratePayrollResult> => {
    const response = await api.post('/api/payroll/generate', data);
    return response.data?.data;
  },

  processPayroll: async (id: string): Promise<Payroll> => {
    const response = await api.put(`/api/payroll/${id}/process`);
    return response.data?.data?.payroll;
  },

  markPaid: async (id: string): Promise<Payroll> => {
    const response = await api.put(`/api/payroll/${id}/paid`);
    return response.data?.data?.payroll;
  },

  regeneratePayroll: async (
    employeeId: string,
    data: RegeneratePayrollPayload
  ): Promise<Payroll> => {
    const response = await api.post(`/api/payroll/${employeeId}/regenerate`, data);
    return response.data?.data?.payroll;
  },

  downloadPayslipPdf: async (id: string): Promise<Blob> => {
    const response = await api.get(`/api/payroll/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  },

  getSalaryStructures: async (params: Record<string, string | number> = {}): Promise<PaginatedSalaryStructureResponse> => {
    const response = await api.get('/api/payroll/salary-structure', { params });
    return response.data;
  },

  getSalaryStructureByEmployee: async (employeeId: string): Promise<SalaryStructure[]> => {
    const response = await api.get(`/api/payroll/salary-structure/${employeeId}`);
    return response.data?.data?.structures ?? [];
  },

  createSalaryStructure: async (data: SalaryStructurePayload): Promise<SalaryStructure> => {
    const response = await api.post('/api/payroll/salary-structure', data);
    return response.data?.data?.structure;
  },

  updateSalaryStructure: async (
    id: string,
    data: Partial<SalaryStructurePayload>
  ): Promise<SalaryStructure> => {
    const response = await api.put(`/api/payroll/salary-structure/${id}`, data);
    return response.data?.data?.structure;
  },

  getPayrollSettings: async (): Promise<PayrollSettings> => {
    const response = await api.get('/api/payroll/settings');
    return response.data?.data?.settings;
  },

  updatePayrollSettings: async (
    data: Partial<Pick<PayrollSettings, 'payrollGenerationDay' | 'defaultPF'>>
  ): Promise<PayrollSettings> => {
    const response = await api.put('/api/payroll/settings', data);
    return response.data?.data?.settings;
  }
};

export default payrollService;
