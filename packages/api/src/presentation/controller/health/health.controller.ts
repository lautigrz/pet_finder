import { Request, Response } from "express";
import { injectable } from "tsyringe";

@injectable()
export class HealthController {
  handle = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: Date.now(),
    });
  };
}
