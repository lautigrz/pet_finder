import { Router } from "express";
import healthRouter from "./health/health.router";
import userRouter from "./user/user.router";
const router = Router();

router.use('/health', healthRouter);
router.use('/users', userRouter);

export default router;