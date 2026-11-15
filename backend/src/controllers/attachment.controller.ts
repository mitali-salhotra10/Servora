import { Request, Response, NextFunction } from 'express';
import { AttachmentService } from '../services/attachment.service';
import { BadRequestError } from '../utils/errors';
import { AttachmentType } from '@prisma/client';

export class AttachmentController {
  public static async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new BadRequestError('No file uploaded. Expected multipart form field "file"');
      }

      const { visitRecordId, equipmentId, fileType } = req.body;

      const result = await AttachmentService.processAndSaveFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        {
          visitRecordId,
          equipmentId,
          fileType: fileType as AttachmentType
        }
      );

      res.status(201).json({
        success: true,
        message: 'Evidence attachment uploaded and SHA-256 digest computed successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { attachment } = await AttachmentService.getAttachmentById(id, req.user);

      res.status(200).json({
        success: true,
        data: attachment
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { attachment, filePath } = await AttachmentService.getAttachmentById(id, req.user);

      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Length', attachment.fileSizeBytes);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  }
}
