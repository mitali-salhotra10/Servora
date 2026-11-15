import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Handle JSON parse error (e.g. malformed body)
  if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'Malformed JSON payload in request body'
      }
    });
    return;
  }

  // Handle Multer upload limits (e.g. file size exceeded)
  if (err instanceof MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File exceeds maximum permissible size of 5 MB'
      : err.message;
    res.status(400).json({
      success: false,
      error: {
        code: err.code,
        message
      }
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.constructor.name.replace('Error', '').toUpperCase(),
        message: err.message,
        details: err.details
      }
    });
    return;
  }

  // Unhandled / Internal Server Error
  const isProduction = env.NODE_ENV === 'production';
  const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction ? 'An unexpected server error occurred' : errorMessage,
      ...(isProduction ? {} : { stack: err instanceof Error ? err.stack : undefined })
    }
  });
}
