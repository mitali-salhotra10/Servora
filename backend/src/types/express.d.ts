import { UserRole } from '@prisma/client';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
  customerProfileId?: string;
  providerProfileId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}
