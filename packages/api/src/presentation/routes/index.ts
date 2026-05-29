import { Router } from "express";
import healthRouter from "./health/health.router";
import userRouter from "./user/user.router";
import { createReportRoute } from "./report/report.router";
import { createPetRoute } from "./pet/pet.router";
import authRouter from "./auth/auth.router";

const router = Router();

router.use('/health', healthRouter);
router.use('/users', userRouter);
router.use('/reports', createReportRoute);
router.use('/pets', createPetRoute);

router.use('/auth', authRouter);

export default router;