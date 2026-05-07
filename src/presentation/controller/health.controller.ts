import { Request, Response } from "express";
export class HealthyController {


    public health = (req: Request, res: Response) => {
    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: Date.now()
        });
    };

}