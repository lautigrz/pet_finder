import { Request, Response, NextFunction, RequestHandler } from "express";
import { errorToHttpStatus } from "@presentation/errors/error-mapper";


export async function invoke(
    handler: RequestHandler,
    req: Partial<Request>,
    res: Partial<Response>,
): Promise<void> {
    let capturedError: unknown = undefined;

    const next: NextFunction = (err?: unknown) => {
        capturedError = err;
    };

    await handler(req as Request, res as Response, next);

    if (capturedError !== undefined) {
        const { statusCode, code, message } = errorToHttpStatus(capturedError as Error);
        if (statusCode >= 500) console.error("[ERROR]", capturedError);
        res.status!(statusCode);
        res.json!({ status: "error", code, message });
    }
}

