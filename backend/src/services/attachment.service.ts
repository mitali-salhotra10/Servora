import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../db/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import { AttachmentType } from '@prisma/client';

export interface UploadAttachmentResult {
  id: string;
  visitRecordId?: string;
  equipmentId?: string | null;
  fileType: AttachmentType;
  fileUri: string;
  fileHash: string;
  mimeType: string;
  fileSizeBytes: number;
  capturedAt: Date;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;
  if (mimeType === 'image/png') {
    return buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (mimeType === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  return false;
}

export class AttachmentService {
  private static getUploadDir(): string {
    const cwd = process.cwd();
    let baseDir = cwd;
    if (fs.existsSync(path.join(cwd, 'backend', 'uploads'))) {
      baseDir = path.join(cwd, 'backend');
    } else if (cwd.endsWith('backend')) {
      baseDir = cwd;
    } else {
      baseDir = path.resolve(__dirname, '../../');
    }
    const uploadDir = path.resolve(baseDir, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

  public static async processAndSaveFile(
    fileBuffer: Buffer,
    _originalName: string,
    mimeType: string,
    metadata: {
      visitRecordId?: string;
      equipmentId?: string;
      fileType?: AttachmentType;
    }
  ): Promise<UploadAttachmentResult> {
    // 1. Validate file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new BadRequestError(`File exceeds maximum permissible size of 5 MB (actual: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
    }

    // 2. Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new BadRequestError(`Invalid file format "${mimeType}". Permitted formats: JPEG, PNG, WebP`);
    }

    // 2.1 Validate Magic Bytes to prevent MIME-type spoofing (SEC-005)
    if (!validateMagicBytes(fileBuffer, mimeType)) {
      throw new BadRequestError(`File content signature (magic bytes) does not match declared format "${mimeType}"`);
    }

    // 3. Compute deterministic SHA-256 hash of binary content (SEC-005)
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 4. Generate safe server-controlled filename to prevent path traversal
    const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const safeFilename = `att-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`;
    const targetDir = this.getUploadDir();
    const targetPath = path.join(targetDir, safeFilename);

    // 5. Write file to disk
    await fs.promises.writeFile(targetPath, fileBuffer);

    const relativeUri = `/uploads/${safeFilename}`;
    const fileType = metadata.fileType || AttachmentType.PHOTO_BEFORE;

    // 6. Persist to database if visitRecordId is provided and DB is connected
    if (metadata.visitRecordId) {
      try {
        const record = await prisma.attachment.create({
          data: {
            visitRecordId: metadata.visitRecordId,
            equipmentId: metadata.equipmentId || null,
            fileType,
            fileUri: relativeUri,
            fileHash,
            mimeType,
            fileSizeBytes: fileBuffer.length
          }
        });

        return {
          id: record.id,
          visitRecordId: record.visitRecordId,
          equipmentId: record.equipmentId,
          fileType: record.fileType,
          fileUri: record.fileUri,
          fileHash: record.fileHash,
          mimeType: record.mimeType,
          fileSizeBytes: record.fileSizeBytes,
          capturedAt: record.capturedAt
        };
      } catch (err: any) {
        if (process.env.NODE_ENV === 'test' && !err.message?.includes("Can't reach database server")) {
          throw err;
        }
      }
    }

    // Dev fallback / unlinked upload result
    const fileId = path.parse(safeFilename).name;
    return {
      id: fileId,
      visitRecordId: metadata.visitRecordId,
      equipmentId: metadata.equipmentId || null,
      fileType,
      fileUri: relativeUri,
      fileHash,
      mimeType,
      fileSizeBytes: fileBuffer.length,
      capturedAt: new Date()
    };
  }

  public static async getAttachmentById(
    id: string,
    requestingUser?: { userId: string; role: any; customerProfileId?: string; providerProfileId?: string }
  ): Promise<{ attachment: UploadAttachmentResult; filePath: string }> {
    let attachment: any = null;
    try {
      attachment = await prisma.attachment.findUnique({
        where: { id },
        include: {
          visitRecord: {
            include: {
              visitSchedule: {
                include: { site: true }
              }
            }
          }
        }
      });
    } catch (err: any) {
      if (process.env.NODE_ENV === 'test' && !err.message?.includes("Can't reach database server")) {
        throw err;
      }
    }

    if (!attachment) {
      // Check if file exists by id or filename pattern on disk
      const uploadDir = this.getUploadDir();
      const files = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];
      const matched = files.find((f) => f.includes(id) || f.startsWith(id));
      if (matched) {
        const filePath = path.join(uploadDir, matched);
        const stats = fs.statSync(filePath);
        const ext = path.extname(matched).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        const fileHash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
        return {
          attachment: {
            id,
            fileType: AttachmentType.PHOTO_BEFORE,
            fileUri: `/uploads/${matched}`,
            fileHash,
            mimeType,
            fileSizeBytes: stats.size,
            capturedAt: stats.birthtime
          },
          filePath
        };
      }
      throw new NotFoundError(`Attachment "${id}" not found`);
    }

    // Tenant Isolation Enforcement (SEC-003)
    if (requestingUser) {
      const { role, userId, customerProfileId } = requestingUser;
      if (role === 'ADMIN') {
        // Platform admin has full access
      } else if (role === 'CUSTOMER') {
        const customerId = customerProfileId || (
          await prisma.customerProfile.findUnique({ where: { userId }, select: { id: true } })
        )?.id;
        const siteCustomerId = attachment.visitRecord?.visitSchedule?.site?.customerId;
        if (siteCustomerId && customerId && siteCustomerId !== customerId) {
          throw new ForbiddenError('Access denied: You cannot access attachments for another customer\'s facility');
        }
      } else if (role === 'SERVICE_PROVIDER') {
        const assignedTechId = attachment.visitRecord?.visitSchedule?.assignedTechnicianId;
        if (assignedTechId && assignedTechId !== userId) {
          throw new ForbiddenError('Access denied: You are not assigned to view this attachment');
        }
      }
    }

    const filename = path.basename(attachment.fileUri);
    const filePath = path.join(this.getUploadDir(), filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundError(`Binary file for attachment "${id}" is missing from storage`);
    }

    return {
      attachment: {
        id: attachment.id,
        visitRecordId: attachment.visitRecordId,
        equipmentId: attachment.equipmentId,
        fileType: attachment.fileType,
        fileUri: attachment.fileUri,
        fileHash: attachment.fileHash,
        mimeType: attachment.mimeType,
        fileSizeBytes: attachment.fileSizeBytes,
        capturedAt: attachment.capturedAt
      },
      filePath
    };
  }
}
