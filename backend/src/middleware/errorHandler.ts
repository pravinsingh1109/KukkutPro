import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public field?: string;

  constructor(message: string, statusCode: number = 400, code: string = 'BAD_REQUEST', field?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.field ? { field: err.field } : {}),
    });
    return;
  }

  console.error('Unhandled Server Error:', err);

  res.status(500).json({
    error: 'An unexpected server error occurred',
    code: 'SERVER_ERROR',
  });
};
