import { apiClient } from './client';
import { ApiResponse } from '../types';

export interface AttachmentUploadResponse {
  id: string;
  visitRecordId?: string;
  equipmentId?: string | null;
  fileType: string;
  fileUri: string;
  fileHash: string;
  mimeType: string;
  fileSizeBytes: number;
  capturedAt: string;
}

export const attachmentsApi = {
  upload: async (
    file: File,
    metadata: {
      visitRecordId?: string;
      equipmentId?: string;
      fileType?: 'PHOTO_BEFORE' | 'PHOTO_AFTER' | 'PRESSURE_GAUGE' | 'SIGNATURE_IMAGE' | 'DEFECT_PROOF';
    },
    onProgress?: (percent: number) => void
  ): Promise<AttachmentUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.visitRecordId) formData.append('visitRecordId', metadata.visitRecordId);
    if (metadata.equipmentId) formData.append('equipmentId', metadata.equipmentId);
    if (metadata.fileType) formData.append('fileType', metadata.fileType);

    const response = await apiClient.post<ApiResponse<AttachmentUploadResponse>>(
      '/attachments',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        }
      }
    );

    return response.data.data;
  },

  getFileUrl: (attachmentId: string): string => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${baseUrl}/attachments/${attachmentId}/file`;
  }
};
