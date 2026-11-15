export type UserRole = 'CUSTOMER' | 'SERVICE_PROVIDER' | 'SERVICE_MANAGER' | 'ADMIN';

export interface CustomerProfile {
  id: string;
  userId?: string;
  companyName: string | null;
  contactPersonName: string;
  taxId?: string | null;
  billingAddress?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProviderProfile {
  id: string;
  userId?: string;
  businessName: string;
  licenseNumber: string;
  verificationStatus: string;
  serviceRadiusKm?: number;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  phone: string | null;
  isActive: boolean;
  customerProfile?: CustomerProfile | null;
  providerProfile?: ProviderProfile | null;
}

export interface AuthData {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ApiErrorResponse {
  success: false;
  message?: string;
  error?: {
    message: string;
    code?: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export interface Site {
  id: string;
  customerId: string;
  siteName: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number | string;
  longitude: number | string;
  geofenceRadiusMeters: number;
  onSiteContactName: string;
  onSiteContactPhone: string;
  createdAt: string;
  updatedAt: string;
  customer?: CustomerProfile;
  _count?: {
    equipment?: number;
    visitSchedules?: number;
    contracts?: number;
  };
  equipment?: Array<{
    id: string;
    qrCode: string;
    equipmentType: string;
    status: string;
    locationDescription?: string;
  }>;
}

export interface CreateSiteInput {
  siteName: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters?: number;
  onSiteContactName: string;
  onSiteContactPhone: string;
}

export type UpdateSiteInput = Partial<CreateSiteInput>;

export interface RegisterInput {
  email: string;
  password: string;
  role: 'CUSTOMER' | 'SERVICE_PROVIDER';
  phone?: string;
  companyName?: string;
  contactPersonName?: string;
  billingAddress?: string;
  businessName?: string;
  licenseNumber?: string;
  serviceRadiusKm?: number;
}

export interface LoginInput {
  email: string;
  password: string;
}
