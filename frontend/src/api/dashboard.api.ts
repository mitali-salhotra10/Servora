import { apiClient } from './client';
import { ApiResponse } from '../types';

export interface DashboardMetricsResponse {
  role: string;
  isDemoMode: boolean;
  dataSource: 'POSTGRESQL_LIVE' | 'SIMULATED_DEMO';
  metrics: Record<string, any>;
}

export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetricsResponse> => {
    const response = await apiClient.get<ApiResponse<DashboardMetricsResponse>>('/dashboard/metrics');
    return response.data.data;
  }
};
