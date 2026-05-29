import api from '../lib/api';

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description: string;
  isRecurringYearly: boolean;
  createdBy: { id: string; name: string; email: string } | null;
  updatedBy: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface HolidayFilters {
  page?: number;
  limit?: number;
  year?: number;
  search?: string;
  upcoming?: boolean;
}

export interface PaginatedResult<T> {
  total: number;
  page: number;
  limit: number;
  pages: number;
  data: T[];
}

const holidayService = {
  getHolidays: async (params: HolidayFilters = {}): Promise<PaginatedResult<Holiday>> => {
    const response = await api.get('/api/holidays', { params });
    const body = response.data;
    return {
      total: body.data.pagination.total,
      page: body.data.pagination.page,
      limit: body.data.pagination.limit,
      pages: body.data.pagination.pages,
      data: body.data.holidays,
    };
  },

  getCurrentYearHolidays: async (): Promise<Holiday[]> => {
    const response = await api.get('/api/holidays/current-year');
    return response.data.data.holidays;
  },

  createHoliday: async (data: {
    name: string;
    date: string;
    description?: string;
    isRecurringYearly?: boolean;
  }) => {
    const response = await api.post('/api/holidays', data);
    return response.data.data.holiday;
  },

  updateHoliday: async (
    id: string,
    data: { name?: string; date?: string; description?: string; isRecurringYearly?: boolean }
  ) => {
    const response = await api.put(`/api/holidays/${id}`, data);
    return response.data.data.holiday;
  },

  deleteHoliday: async (id: string) => {
    const response = await api.delete(`/api/holidays/${id}`);
    return response.data;
  },
};

export default holidayService;
