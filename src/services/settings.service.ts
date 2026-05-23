import api from '../lib/api';

export interface CompanySettings {
  id: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyLogo: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  createdAt: string;
  updatedAt: string;
}

const settingsService = {
  getCompanySettings: async (): Promise<CompanySettings> => {
    const response = await api.get('/api/settings/company');
    if (!response.data?.data?.settings) throw new Error('Failed to load company settings');
    return response.data.data.settings;
  },

  updateCompanySettings: async (data: Partial<CompanySettings>): Promise<CompanySettings> => {
    const response = await api.put('/api/settings/company', data);
    if (!response.data?.data?.settings) throw new Error('Failed to update company settings');
    return response.data.data.settings;
  },
};

export default settingsService;