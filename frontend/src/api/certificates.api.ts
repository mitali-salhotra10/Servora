import { apiClient } from './client';
import { ApiResponse } from '../types';

export interface PublicCertificateVerification {
  certificateNumber: string;
  status: 'VALID' | 'EXPIRED' | 'REVOKED';
  issuedDate: string;
  expirationDate: string;
  maskedSiteName: string;
  providerBusinessName: string;
  equipmentCount: number;
  complianceVerdict: 'COMPLIANT' | 'DEFECTS_FLAGGED';
  verificationHash: string;
  isSealValid: boolean;
}

export const certificatesApi = {
  verifyCertificate: async (certificateNumber: string): Promise<PublicCertificateVerification> => {
    const response = await apiClient.get<ApiResponse<PublicCertificateVerification>>(
      `/certificates/verify/${encodeURIComponent(certificateNumber)}`
    );
    return response.data.data;
  },

  getPdfUrl: (certificateIdOrNumber: string): string => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${baseUrl}/certificates/${encodeURIComponent(certificateIdOrNumber)}/pdf`;
  },

  generate: async (visitRecordId: string): Promise<any> => {
    const response = await apiClient.post<ApiResponse<any>>('/certificates/generate', { visitRecordId });
    return response.data.data;
  },

  getMyCertificates: async (): Promise<any[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/certificates');
    return response.data.data;
  }
};
