import { Router } from "express";
import { container } from "tsyringe";
import { HealthController } from "@presentation/controller/health/health.controller";

const router = Router();

const healthController = container.resolve(HealthController);
router.get("/", healthController.handle);

export default router;