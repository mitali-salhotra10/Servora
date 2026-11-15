import { apiClient } from './client';
import { ApiResponse } from '../types';
import { CachedEquipment } from '../db';

export const equipmentApi = {
  getByQr: async (qrCode: string): Promise<CachedEquipment & { site?: any }> => {
    const response = await apiClient.get<ApiResponse<CachedEquipment & { site?: any }>>(
      `/equipment/qr/${encodeURIComponent(qrCode)}`
    );
    return response.data.data;
  },

  getBySite: async (siteId: string): Promise<CachedEquipment[]> => {
    const response = await apiClient.get<ApiResponse<CachedEquipment[]>>(`/equipment/site/${siteId}`);
    return response.data.data;
  },

  create: async (data: any): Promise<CachedEquipment> => {
    const response = await apiClient.post<ApiResponse<CachedEquipment>>('/equipment', data);
    return response.data.data;
  }
};
