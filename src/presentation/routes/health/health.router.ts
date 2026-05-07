import { Router } from "express";
import { HealthyController } from "../../controller/health.controller";

const router = Router();

const healthyController = new HealthyController();
router.get("/", healthyController.health);

export default router;