import api from '../lib/api';
import type { EmployeeBrief } from './leave.service';

export type ClaimStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Reimbursed';

export interface ClaimAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  data?: string | null;
}

export interface ClaimUserRef {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Claim {
  id: string;
  employee: EmployeeBrief & { reportingManagerId?: string };
  name: string;
  amount: number;
  expenseDate: string;
  description?: string;
  status: ClaimStatus;
  attachments: ClaimAttachment[];
  submittedBy?: ClaimUserRef | null;
  approvedBy?: ClaimUserRef | null;
  approvedAt?: string | null;
  rejectedBy?: ClaimUserRef | null;
  rejectedAt?: string | null;
  cancelledBy?: ClaimUserRef | null;
  cancelledAt?: string | null;
  reimbursedBy?: ClaimUserRef | null;
  reimbursedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimSummary {
  Pending: number;
  Approved: number;
  Rejected: number;
  Reimbursed: number;
}

export interface ClaimFilters {
  page?: number;
  limit?: number;
  employee?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ClaimPayload {
  name: string;
  amount: number;
  expenseDate: string;
  description?: string;
  attachments?: Array<{
    fileName: string;
    mimeType: string;
    data: string;
  }>;
}

export interface PaginatedClaimResponse {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  data: Claim[];
}

const claimService = {
  getClaims: async (params: ClaimFilters = {}): Promise<PaginatedClaimResponse> => {
    const response = await api.get('/api/claims', { params });
    return response.data;
  },

  getClaimSummary: async (): Promise<ClaimSummary> => {
    const response = await api.get('/api/claims/summary');
    return response.data?.data?.summary ?? {
      Pending: 0,
      Approved: 0,
      Rejected: 0,
      Reimbursed: 0
    };
  },

  getClaimById: async (id: string): Promise<Claim> => {
    const response = await api.get(`/api/claims/${id}`);
    return response.data?.data?.claim;
  },

  createClaim: async (data: ClaimPayload): Promise<Claim> => {
    const response = await api.post('/api/claims', data);
    return response.data?.data?.claim;
  },

  updateClaim: async (id: string, data: ClaimPayload): Promise<Claim> => {
    const response = await api.put(`/api/claims/${id}`, data);
    return response.data?.data?.claim;
  },

  approveClaim: async (id: string): Promise<Claim> => {
    const response = await api.put(`/api/claims/${id}/approve`);
    return response.data?.data?.claim;
  },

  rejectClaim: async (id: string): Promise<Claim> => {
    const response = await api.put(`/api/claims/${id}/reject`);
    return response.data?.data?.claim;
  },

  cancelClaim: async (id: string): Promise<Claim> => {
    const response = await api.put(`/api/claims/${id}/cancel`);
    return response.data?.data?.claim;
  },

  reimburseClaim: async (id: string): Promise<Claim> => {
    const response = await api.put(`/api/claims/${id}/reimburse`);
    return response.data?.data?.claim;
  },

  deleteClaim: async (id: string): Promise<void> => {
    await api.delete(`/api/claims/${id}`);
  }
};

export default claimService;
