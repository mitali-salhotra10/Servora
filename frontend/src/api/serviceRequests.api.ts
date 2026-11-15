import { apiClient } from './client';
import { ApiResponse } from '../types';

export interface ServiceRequest {
  id: string;
  ticketNumber: string;
  customerId?: string;
  siteId: string;
  siteName: string;
  category: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  status: 'SUBMITTED' | 'ACCEPTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'RESOLVED' | 'REJECTED' | 'CANCELLED';
  preferredDate: string;
  preferredTimeSlot?: string;
  customerNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateServiceRequestPayload {
  siteId: string;
  category: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  preferredDate: string;
  preferredTimeSlot?: string;
  customerNotes: string;
}

export const serviceRequestsApi = {
  getAll: async (): Promise<ServiceRequest[]> => {
    const response = await apiClient.get<ApiResponse<ServiceRequest[]>>('/service-requests');
    return response.data.data;
  },

  create: async (payload: CreateServiceRequestPayload): Promise<ServiceRequest> => {
    const response = await apiClient.post<ApiResponse<ServiceRequest>>('/service-requests', payload);
    return response.data.data;
  },

  updateStatus: async (id: string, status: string, rejectionReason?: string): Promise<ServiceRequest> => {
    const response = await apiClient.patch<ApiResponse<ServiceRequest>>(`/service-requests/${id}/status`, {
      status,
      rejectionReason
    });
    return response.data.data;
  }
};
