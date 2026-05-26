import { Router } from "express";
import healthRouter from "./health/health.router";
import userRouter from "./user/user.router";
import authRouter from "./auth/auth.router";
const router = Router();

router.use('/health', healthRouter);
router.use('/users', userRouter);
router.use('/auth', authRouter);

export default router;