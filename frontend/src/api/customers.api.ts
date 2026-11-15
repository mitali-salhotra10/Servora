import { authApi } from './auth.api';
import { CustomerProfile } from '../types';

export const customersApi = {
  /**
   * Retrieves the current authenticated customer's profile from the session endpoint.
   */
  getMyCustomerProfile: async (): Promise<CustomerProfile | null> => {
    const user = await authApi.getMe();
    return user.customerProfile || null;
  },
};
