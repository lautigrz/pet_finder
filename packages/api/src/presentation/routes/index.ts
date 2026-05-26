import { Router } from "express";
import healthRouter from "./health/health.router";
import userRouter from "./user/user.router";
import { createReportRoute } from "./report/report.router";
const router = Router();

router.use('/health', healthRouter);
router.use('/users', userRouter);
router.use('/reports', createReportRoute);
export default router;