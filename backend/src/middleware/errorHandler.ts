import { Request, Response, NextFunction } from 'express';
import { AxiosError } from 'axios';

interface AppError extends Error {
  status?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`);

  if (err.stack) {
    console.error(err.stack);
  }

  // Handle Axios errors (upstream API failures)
  if (err instanceof AxiosError) {
    const status = err.response?.status ?? 502;
    const upstreamMessage = typeof err.response?.data === 'object' && err.response?.data !== null
      ? JSON.stringify(err.response.data)
      : err.message;

    res.status(status).json({
      error: `Erreur lors de l'appel a un service externe : ${upstreamMessage}`,
      status,
    });
    return;
  }

  const status = err.status ?? 500;
  res.status(status).json({
    error: err.message || 'Erreur interne du serveur.',
    status,
  });
}
