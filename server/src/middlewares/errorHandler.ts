import { Request, Response, NextFunction } from 'express';

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

  console.error(
    `[${new Date().toISOString()}] ${req.method} ${req.path} → ${statusCode}:`,
    err.message
  );

  res.status(statusCode).json({ msg: message });
};
