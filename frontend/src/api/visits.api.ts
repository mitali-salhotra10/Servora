import { apiClient } from './client';
import { ApiResponse } from '../types';
import { CachedVisit } from '../db';

export const visitsApi = {
  getMyAssigned: async (): Promise<CachedVisit[]> => {
    const response = await apiClient.get<ApiResponse<CachedVisit[]>>('/visits/my-assigned');
    return response.data.data;
  },

  getById: async (id: string): Promise<CachedVisit> => {
    const response = await apiClient.get<ApiResponse<CachedVisit>>(`/visits/${id}`);
    return response.data.data;
  },

  updateStatus: async (id: string, status: string): Promise<CachedVisit> => {
    const response = await apiClient.patch<ApiResponse<CachedVisit>>(`/visits/${id}/status`, { status });
    return response.data.data;
  },

  getChecklistTemplates: async (): Promise<any[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/visits/checklists/templates');
    return response.data.data;
  },

  submitInspection: async (visitId: string, payload: any, idempotencyKey?: string): Promise<any> => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const response = await apiClient.post<ApiResponse<any>>(
      `/visits/${visitId}/inspections`,
      payload,
      { headers }
    );
    return response.data.data;
  },

  getHistory: async (): Promise<any[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/visits/history');
    return response.data.data;
  }
};
