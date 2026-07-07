import { Request, Response, NextFunction } from 'express';
import { logger } from '@pet-alert/shared';
import { errorToHttpStatus } from '@presentation/errors/error-mapper';

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const { statusCode, code, message } = errorToHttpStatus(err as Error);
    console.log(err);
    logError(statusCode, code, message, err, req);
    res.status(statusCode).json({ status: 'error', code, message });
};

const logError = (statusCode: number, code: string, message: string, err: unknown, req: Request) => {
    const meta = { code, statusCode, method: req.method, path: req.originalUrl };
    if (statusCode >= 500) logger.error(message, { ...meta, stack: stackOf(err) });
    else logger.warn(message, meta);
};

const stackOf = (err: unknown) => (err instanceof Error ? err.stack : undefined);
