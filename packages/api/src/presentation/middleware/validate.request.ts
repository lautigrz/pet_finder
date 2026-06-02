import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validateRequest = (schema: z.ZodTypeAny) =>
    (req: Request, res: Response, next: NextFunction): void => {
        let body = req.body;

        if (typeof req.body?.data === 'string') {
            try {
                body = JSON.parse(req.body.data.trim());
            } catch (e) {
                res.status(400).json({ error: 'Invalid JSON in data field' });
                return;
            }
        }

        const result = schema.safeParse({
            body,
            query: req.query,
            params: req.params,
        });

        if (!result.success) {
            res.status(400).json({
                error: 'Validation error',
                issues: result.error.issues.map(i => ({
                    field: i.path.join('.'),
                    message: i.message,
                }))
            });
            return;
        }

        req.validated = result.data as { body?: any; query?: any; params?: any };
        next();
    };