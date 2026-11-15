import { apiClient, setStoredToken } from './client';
import { ApiResponse, AuthData, LoginInput, RegisterInput, User } from '../types';

export const authApi = {
  login: async (credentials: LoginInput): Promise<AuthData> => {
    const response = await apiClient.post<ApiResponse<AuthData>>('/auth/login', credentials);
    const authData = response.data.data;
    if (authData.token) {
      setStoredToken(authData.token);
    }
    return authData;
  },

  register: async (input: RegisterInput): Promise<AuthData> => {
    const response = await apiClient.post<ApiResponse<AuthData>>('/auth/register', input);
    const authData = response.data.data;
    if (authData.token) {
      setStoredToken(authData.token);
    }
    return authData;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setStoredToken(null);
    }
  },
};
