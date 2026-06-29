import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { logger } from '@pet-alert/shared';
import { errorHandler } from '../error-handler';

const buildRes = (): Partial<Response> => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
});

const buildReq = (): Partial<Request> => ({ method: 'GET', originalUrl: '/reports' });

const run = (err: unknown) => {
    const res = buildRes();
    errorHandler(err, buildReq() as Request, res as Response, vi.fn());
    return res;
};

describe('errorHandler', () => {
    beforeEach(() => vi.restoreAllMocks());

    it('logs unexpected errors with logger.error and responds 500', () => {
        const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);
        const res = run(new Error('boom'));

        expect(errorSpy).toHaveBeenCalledOnce();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            status: 'error',
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
        });
    });

    it('logs business errors with logger.warn and responds with the mapped 4xx', () => {
        const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => logger);
        const err = Object.assign(new Error('missing'), { name: 'MissingFieldError' });
        const res = run(err);

        expect(warnSpy).toHaveBeenCalledOnce();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            status: 'error',
            code: 'MISSING_FIELD',
            message: 'missing',
        });
    });
});
