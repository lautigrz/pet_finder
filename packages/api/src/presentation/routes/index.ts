import { Router } from "express";
import { container } from "tsyringe";
import healthRouter from "./health/health.router";
import userRouter from "./user/user.router";
import { createReportRoute } from "./report/report.router";
import { createPetRoute } from "./pet/pet.router";
import authRouter from "./auth/auth.router";
import { catalogRouter } from "./catalog/catalog.router";
import conversationRouter from "./conversation/conversation.router";
import { matchRouter } from "./match/match.router";
import notificationRouter from "./notifications/notification.router";
import { messageRouter } from "./message/message.router";
import { contentReportRoute } from "./content-report/content-report.router";
import { paymentRoute } from "./payment/payment.router";
import { appealRoute } from "./appeal/appeal.router";
import { statsRoute } from "./stats/stats.router";
import { ITokenSigner } from "@domain/services/ITokenSigner";
import { requireAuth } from "@presentation/middleware/requireAuth.middleware";
import { GetUserExperienceController } from "@presentation/controller/user/get-user-experience.controller";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const getUserExperienceController = container.resolve(GetUserExperienceController);

router.use('/health', healthRouter);
router.get('/me/xp', requireAuth(tokenSigner), getUserExperienceController.handle);
router.use('/users', userRouter);
router.use('/reports', createReportRoute);
router.use('/pets', createPetRoute);
router.use('/catalog', catalogRouter);
router.use('/conversations', conversationRouter);
router.use("/match", matchRouter)
router.use('/notifications', notificationRouter);
router.use('/auth', authRouter);
router.use('/messages', messageRouter);
router.use('/content-reports', contentReportRoute);
router.use('/payments', paymentRoute);
router.use('/appeals', appealRoute);
router.use('/admin/stats', statsRoute);

export default router;
