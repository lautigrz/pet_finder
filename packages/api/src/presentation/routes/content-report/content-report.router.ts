import { Router } from "express";
import { container } from "tsyringe";
import { ITokenSigner } from "@domain/services/ITokenSigner";
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import { requireAdmin } from "src/presentation/middleware/requireAdmin.middleware";
import { validateRequest } from "src/presentation/middleware/validate.request";
import { createContentReportRequestSchema, contentReportQueueSchema } from "src/presentation/schemas/content-report/content-report.schema";
import { CreateContentReportController } from "@presentation/controller/content-report/create-content-report.controller";
import { GetContentReportQueueController } from "@presentation/controller/content-report/get-content-report-queue.controller";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const userRepository = container.resolve<IUserRepository>("UserRepository");

const createContentReport = container.resolve(CreateContentReportController);
const getContentReportQueue = container.resolve(GetContentReportQueueController);

router.post("/", requireAuth(tokenSigner), validateRequest(createContentReportRequestSchema), createContentReport.handle);
router.get("/", requireAuth(tokenSigner), requireAdmin(userRepository), validateRequest(contentReportQueueSchema), getContentReportQueue.handle);

export const contentReportRoute = router;
