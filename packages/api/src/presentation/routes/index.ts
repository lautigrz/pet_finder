import { Router } from "express";
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
import { missionRoute } from "./mission/mission.routes";
import { missionResponseRoute } from "./mission-response/mission-response.routes";

const router = Router();

router.use('/health', healthRouter);
router.use('/users', userRouter);
router.use('/reports', createReportRoute);
router.use('/missions', missionRoute);
router.use('/pets', createPetRoute);
router.use('/catalog', catalogRouter);
router.use('/conversations', conversationRouter);
router.use("/match", matchRouter)
router.use('/notifications', notificationRouter);
router.use('/auth', authRouter);
router.use('/messages', messageRouter);
router.use('/content-reports', contentReportRoute);
router.use('/mission-responses', missionResponseRoute);

export default router;