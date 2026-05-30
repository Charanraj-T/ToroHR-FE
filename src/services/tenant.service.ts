import api from '../lib/api';

export interface Tenant {
  id: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantListItem extends Tenant {
  adminCount?: number;
}

export interface PaginatedTenantResponse {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  data: TenantListItem[];
}

export interface CreateTenantPayload {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  status?: 'Active' | 'Inactive';
}

export interface UpdateTenantPayload {
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  status?: 'Active' | 'Inactive';
}

export interface TenantAdmin {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface CreateAdminPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateAdminPayload {
  name?: string;
  isActive?: boolean;
  password?: string;
}

const tenantService = {
  list: async (params: { page?: number; limit?: number } = {}): Promise<PaginatedTenantResponse> => {
    const response = await api.get('/api/tenants', { params });
    const body = response.data;
    return {
      data: body.data?.tenants ?? [],
      totalCount: body.data?.pagination?.total ?? 0,
      currentPage: body.data?.pagination?.page ?? 1,
      totalPages: body.data?.pagination?.pages ?? 1,
    };
  },

  getById: async (id: string): Promise<Tenant> => {
    const response = await api.get(`/api/tenants/${id}`);
    return response.data?.data?.tenant;
  },

  create: async (data: CreateTenantPayload): Promise<Tenant> => {
    const response = await api.post('/api/tenants', data);
    return response.data?.data?.tenant;
  },

  update: async (id: string, data: UpdateTenantPayload): Promise<Tenant> => {
    const response = await api.put(`/api/tenants/${id}`, data);
    return response.data?.data?.tenant;
  },

  getAdmins: async (tenantId: string): Promise<TenantAdmin[]> => {
    const response = await api.get(`/api/tenants/${tenantId}/admins`);
    return response.data?.data?.admins ?? [];
  },

  createAdmin: async (tenantId: string, data: CreateAdminPayload): Promise<TenantAdmin> => {
    const response = await api.post(`/api/tenants/${tenantId}/admins`, data);
    return response.data?.data?.admin;
  },

  updateAdmin: async (tenantId: string, adminId: string, data: UpdateAdminPayload): Promise<TenantAdmin> => {
    const response = await api.put(`/api/tenants/${tenantId}/admins/${adminId}`, data);
    return response.data?.data?.admin;
  }
};

export default tenantService;
