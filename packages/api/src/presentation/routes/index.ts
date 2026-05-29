import { Router } from "express";
import healthRouter from "./health/health.router";
const router = Router();

router.use('/health', healthRouter);

export default router;