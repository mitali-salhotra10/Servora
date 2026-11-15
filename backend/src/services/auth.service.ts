import { UserRole, AuditAction } from '@prisma/client';
import { prisma } from '../db/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken, TokenPayload } from '../utils/jwt';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { RegisterInput, LoginInput } from '../schemas/auth.schemas';
import { AuditService } from './audit.service';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: UserRole;
    phone: string | null;
    isActive: boolean;
    customerProfile?: { id: string; companyName: string | null; contactPersonName: string } | null;
    providerProfile?: { id: string; businessName: string; licenseNumber: string; verificationStatus: string } | null;
  };
  token: string;
}

export class AuthService {
  public static async register(input: RegisterInput, ipAddress: string, userAgent: string): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    const hashedPassword = await hashPassword(input.password);

    // Create user and profile in a transaction
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: hashedPassword,
        role: input.role as UserRole,
        phone: input.phone || null,
        tokenVersion: 1,
        isActive: true,
        customerProfile:
          input.role === UserRole.CUSTOMER
            ? {
                create: {
                  companyName: input.companyName || null,
                  contactPersonName: input.contactPersonName || 'Customer Contact',
                  billingAddress: input.billingAddress || null
                }
              }
            : undefined,
        providerProfile:
          input.role === UserRole.SERVICE_PROVIDER
            ? {
                create: {
                  businessName: input.businessName || 'Service Provider',
                  licenseNumber: input.licenseNumber || 'PENDING-LICENSE',
                  serviceRadiusKm: input.serviceRadiusKm || 25
                }
              }
            : undefined
      },
      include: {
        customerProfile: true,
        providerProfile: true
      }
    });

    await AuditService.log({
      userId: user.id,
      action: AuditAction.LOGIN_SUCCESS,
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
      payloadAfterJson: { email: user.email, role: user.role }
    });

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    };

    const token = signToken(tokenPayload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        customerProfile: user.customerProfile
          ? {
              id: user.customerProfile.id,
              companyName: user.customerProfile.companyName,
              contactPersonName: user.customerProfile.contactPersonName
            }
          : null,
        providerProfile: user.providerProfile
          ? {
              id: user.providerProfile.id,
              businessName: user.providerProfile.businessName,
              licenseNumber: user.providerProfile.licenseNumber,
              verificationStatus: user.providerProfile.verificationStatus
            }
          : null
      },
      token
    };
  }

  public static async login(input: LoginInput, ipAddress: string, userAgent: string): Promise<AuthResponse> {
    const emailLower = input.email.toLowerCase();

    // 1. Query database for authenticated user
    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { email: emailLower },
        include: {
          customerProfile: true,
          providerProfile: true
        }
      });
    } catch (err: any) {
      user = null;
    }

    // 2. If user exists in database, authenticate strictly against PostgreSQL credentials
    if (user) {
      if (!user.isActive) {
        await AuditService.log({
          action: AuditAction.LOGIN_FAIL,
          entityType: 'User',
          entityId: user.id,
          ipAddress,
          userAgent,
          payloadBeforeJson: { attemptedEmail: input.email, reason: 'Account inactive' }
        });
        throw new UnauthorizedError('Account is suspended or deactivated');
      }

      const isMatch = await comparePassword(input.password, user.passwordHash);
      if (!isMatch) {
        await AuditService.log({
          userId: user.id,
          action: AuditAction.LOGIN_FAIL,
          entityType: 'User',
          entityId: user.id,
          ipAddress,
          userAgent,
          payloadBeforeJson: { attemptedEmail: input.email, reason: 'Invalid password' }
        });
        throw new UnauthorizedError('Invalid email or password');
      }

      await AuditService.log({
        userId: user.id,
        action: AuditAction.LOGIN_SUCCESS,
        entityType: 'User',
        entityId: user.id,
        ipAddress,
        userAgent
      });

      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
        customerProfileId: user.customerProfile?.id,
        providerProfileId: user.providerProfile?.id
      };

      const token = signToken(tokenPayload);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isActive: user.isActive,
          customerProfile: user.customerProfile
            ? {
                id: user.customerProfile.id,
                companyName: user.customerProfile.companyName,
                contactPersonName: user.customerProfile.contactPersonName
              }
            : null,
          providerProfile: user.providerProfile
            ? {
                id: user.providerProfile.id,
                businessName: user.providerProfile.businessName,
                licenseNumber: user.providerProfile.licenseNumber,
                verificationStatus: user.providerProfile.verificationStatus
              }
            : null
        },
        token
      };
    }

    // 3. User not found in database
    await AuditService.log({
      action: AuditAction.LOGIN_FAIL,
      entityType: 'User',
      entityId: 'unauthenticated',
      ipAddress,
      userAgent,
      payloadBeforeJson: { attemptedEmail: input.email, reason: 'User not found' }
    });
    throw new UnauthorizedError('Invalid email or password');
  }

  public static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerProfile: true,
        providerProfile: true
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
      customerProfile: user.customerProfile,
      providerProfile: user.providerProfile
    };
  }

  public static async revokeTokens(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } }
    });
  }
}
