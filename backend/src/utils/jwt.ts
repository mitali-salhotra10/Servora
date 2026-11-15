import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from './errors';
import { UserRole } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
  customerProfileId?: string;
  providerProfileId?: string;
}

export function signToken(payload: TokenPayload, expiresIn: string | number = env.JWT_EXPIRES_IN): string {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn'],
    algorithm: 'HS256'
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    return decoded as TokenPayload;
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Authentication token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid authentication token');
    }
    throw new UnauthorizedError('Token verification failed');
  }
}
