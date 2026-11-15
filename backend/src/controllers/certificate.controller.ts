import { Request, Response, NextFunction } from 'express';
import { CertificateService } from '../services/certificate.service';
import fs from 'fs';

export class CertificateController {
  public static async verifyPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificateNumber = String(req.params.certificateNumber || '');
      const data = await CertificateService.verifyPublicCertificate(certificateNumber);

      res.status(200).json({
        success: true,
        message: 'Certificate authenticity verified against Servora Trust Chain',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  public static async downloadPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id || '');
      const pdfPath = await CertificateService.getCertificatePdfPath(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Servora-Certificate-${id}.pdf"`);
      res.setHeader('Cache-Control', 'public, max-age=3600');

      const stream = fs.createReadStream(pdfPath);
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  public static async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { visitRecordId } = req.body;
      const { certificate, pdfPath } = await CertificateService.generateForVisitRecord(visitRecordId);

      res.status(201).json({
        success: true,
        message: 'Compliance certificate and verification QR code generated successfully',
        data: {
          ...certificate,
          hasPdf: fs.existsSync(pdfPath)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificates = await CertificateService.getCertificatesForUser(req.user!);
      res.status(200).json({
        success: true,
        data: certificates
      });
    } catch (error) {
      next(error);
    }
  }
}
