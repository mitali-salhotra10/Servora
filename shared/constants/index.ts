export const APP_NAME = 'Servora';
export const DEFAULT_PORT_BACKEND = 5000;
export const DEFAULT_PORT_FRONTEND = 5173;

export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const DEFAULT_GEOFENCE_RADIUS_METERS = 150;
export const JWT_ACCESS_EXPIRY = '15m';
export const JWT_REFRESH_EXPIRY = '7d';

export const COMPLIANCE_STANDARDS = {
  FIRE_EXTINGUISHER: 'NFPA 10',
  FIRE_ALARM: 'NFPA 72',
  GENERAL_SAFETY: 'OSHA 1910.157'
} as const;
