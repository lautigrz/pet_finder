import { Router } from "express";
import { container } from "tsyringe";
import { ContentReportController } from "../../controller/content-report.controller";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import { requireAdmin } from "src/presentation/middleware/requireAdmin.middleware";
import { validateRequest } from "src/presentation/middleware/validate.request";
import { createContentReportRequestSchema, contentReportQueueSchema } from "src/presentation/schemas/content-report/content-report.schema";
import { ITokenSigner } from "../../../domain/services/ITokenSigner";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const userRepository = container.resolve<IUserRepository>("UserRepository");
const contentReportController = container.resolve(ContentReportController);

router.post('/', requireAuth(tokenSigner), validateRequest(createContentReportRequestSchema), contentReportController.create);
router.get('/', requireAuth(tokenSigner), requireAdmin(userRepository), validateRequest(contentReportQueueSchema), contentReportController.getQueue);

export const contentReportRoute = router;
