import { apiClient } from './client';
import { ApiResponse, CreateSiteInput, Site, UpdateSiteInput } from '../types';

export const sitesApi = {
  getMySites: async (): Promise<Site[]> => {
    const response = await apiClient.get<ApiResponse<Site[]>>('/sites');
    return response.data.data;
  },

  getSiteById: async (id: string): Promise<Site> => {
    const response = await apiClient.get<ApiResponse<Site>>(`/sites/${id}`);
    return response.data.data;
  },

  createSite: async (input: CreateSiteInput): Promise<Site> => {
    const response = await apiClient.post<ApiResponse<Site>>('/sites', input);
    return response.data.data;
  },

  updateSite: async (id: string, input: UpdateSiteInput): Promise<Site> => {
    const response = await apiClient.put<ApiResponse<Site>>(`/sites/${id}`, input);
    return response.data.data;
  },
};
