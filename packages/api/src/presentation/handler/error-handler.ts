import { Request, Response, NextFunction } from 'express';
import { errorToHttpStatus } from '@presentation/errors/error-mapper';

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const { statusCode, code, message } = errorToHttpStatus(err as Error);

    if (statusCode >= 500) console.error('[ERROR]', err);
    else console.warn('[WARN]', { code, message });

    res.status(statusCode).json({
        status: 'error',
        code,
        message
    });
};