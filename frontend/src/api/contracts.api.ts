import { apiClient } from './client';
import { ApiResponse } from '../types';

export interface ContractItem {
  id: string;
  contractNumber: string;
  customerId: string;
  providerId: string;
  siteId: string;
  frequency: string;
  startDate: string;
  endDate: string;
  gracePeriodDays: number;
  status: 'ACTIVE' | 'PENDING_RENEWAL' | 'TERMINATED';
  termsSummary?: string;
  site?: {
    id: string;
    siteName: string;
    address: string;
    city: string;
  };
  customer?: {
    id: string;
    companyName: string;
  };
  provider?: {
    id: string;
    businessName: string;
  };
  _count?: {
    visitSchedules: number;
    equipment: number;
  };
}

export const contractsApi = {
  getMyContracts: async (): Promise<ContractItem[]> => {
    const response = await apiClient.get<ApiResponse<ContractItem[]>>('/contracts');
    return response.data.data;
  },

  getById: async (id: string): Promise<ContractItem> => {
    const response = await apiClient.get<ApiResponse<ContractItem>>(`/contracts/${id}`);
    return response.data.data;
  }
};
