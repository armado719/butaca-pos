import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode ?? 500;
  const message = statusCode === 500 ? 'Error interno del servidor' : err.message;

  logger.error(
    { method: req.method, path: req.path, statusCode, err: err.message },
    'Request error'
  );

  res.status(statusCode).json({ msg: message });
};
