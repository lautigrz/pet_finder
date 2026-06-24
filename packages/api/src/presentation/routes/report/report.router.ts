import { Router } from "express";
import prisma from "@infrastructure/prisma/prisma.client";
import { CreateReportController } from "../../controller/report.controller";
import { CreateReportUseCase } from "@application/usecase/report-usecase/create-report.usecase";
import { PrismaReportRepository } from "@infrastructure/repository/report/report.repository";
import { GetReportUseCase } from "@application/usecase/report-usecase/get-report-usecase";
import { ListUserReportsUseCase } from "@application/usecase/report-usecase/list-user-reports.usecase";
import { PrismaPetRepository } from "@infrastructure/repository/pet/pet.repository";
import { PrismaUserRepository } from "@infrastructure/repository/PrismaUserRepository";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import { readAuthConfig } from "src/presentation/config/authConfig";
import { JwtTokenSigner } from "src/infrastructure/security/JwtTokenSigner";
import upload from "@infrastructure/storage/CloudinaryMulterUpload";
import { ClaudinaryService } from "@infrastructure/storage/CloudinaryService";
import { GetFilteredReportsUseCase } from "@application/usecase/report-usecase/get-filter-reports.usecase";
import { validateRequest } from "src/presentation/middleware/validate.request";
import { getFilteredReportsSchema } from "src/presentation/schemas/report/report-filter.schema";
import { listUserReportsSchema } from "src/presentation/schemas/report/list-user-reports.schema";
import { updateStatusReportSchema } from "src/presentation/schemas/report/update-status-report.schema";
import { UpdateStatus } from "@application/usecase/report-usecase/update-status-report";
import { createReportRequestSchema } from "src/presentation/schemas/report/create-report.schema";
import { UpdateReportUseCase } from '@application/usecase/report-usecase/update-report.usecase';
import { updateReportSchema } from 'src/presentation/schemas/report/update-report.schema';
import { NotifyNearbyLostOwnersUseCase } from '@application/usecase/notify-nearby-lost-owners/notify-nearby-lost-owners.usecase';
import { PrismaNotificationPreferencesRepository } from '@infrastructure/repository/PrismaNotificationPreferencesRepository';
import { PrismaDeviceTokenRepository } from '@infrastructure/repository/PrismaDeviceTokenRepository';
import { createPushSender } from '@infrastructure/push/push-sender.factory';
import { PrismaReportFollowerRepository } from "@infrastructure/repository/report/report-follower.repository";
import { FollowReportUseCase } from "@application/usecase/report-usecase/follow-report.usecase";
import { UnfollowReportUseCase } from "@application/usecase/report-usecase/unfollow-report.usecase";
import { IsFollowingReportUseCase } from "@application/usecase/report-usecase/is-following-report.usecase";
import { NotifyReportFollowersOfStatusChangeUseCase } from "@application/usecase/report-usecase/notify-report-followers-of-status-change.usecase";
import { SendPushToUserUseCase } from "@application/usecase/send-push-to-user/send-push-to-user.usecase";


const router = Router();
const { jwtSecret, accessTtl } = readAuthConfig();
const tokenSigner = new JwtTokenSigner(jwtSecret, accessTtl);
const repository = new PrismaReportRepository(prisma);
const reportFollowerRepository = new PrismaReportFollowerRepository(prisma);
const petRepository = new PrismaPetRepository(prisma);
const userRepository = new PrismaUserRepository();
const storageService = new ClaudinaryService();

const notificationPreferencesRepository = new PrismaNotificationPreferencesRepository();
const deviceTokenRepository = new PrismaDeviceTokenRepository();
const pushSender = createPushSender();

const sendPushToUserUseCase = new SendPushToUserUseCase(
    deviceTokenRepository,
    pushSender,
);

const notifyReportFollowersOfStatusChangeUseCase =
    new NotifyReportFollowersOfStatusChangeUseCase(
        reportFollowerRepository,
        sendPushToUserUseCase,
    );

const createReportUseCase = new CreateReportUseCase(
    repository,
    userRepository,
    petRepository,
    storageService,
);

const getReportUseCase = new GetReportUseCase(repository, userRepository);
const filteresReportsUseCase = new GetFilteredReportsUseCase(repository);
const listUserReportsUseCase = new ListUserReportsUseCase(repository, petRepository);

const updateStatusUseCase = new UpdateStatus(
    repository,
    notifyReportFollowersOfStatusChangeUseCase,
);

const updateReportUseCase = new UpdateReportUseCase(
    repository,
    petRepository,
    storageService,
);

const notifyNearbyLostOwnersUseCase = new NotifyNearbyLostOwnersUseCase(
    repository,
    notificationPreferencesRepository,
    deviceTokenRepository,
    pushSender,
);

const followReportUseCase = new FollowReportUseCase(
    repository,
    reportFollowerRepository,
);

const unfollowReportUseCase = new UnfollowReportUseCase(
    reportFollowerRepository,
);

const isFollowingReportUseCase = new IsFollowingReportUseCase(
    reportFollowerRepository,
);

const createReportController = new CreateReportController(
    createReportUseCase,
    getReportUseCase,
    listUserReportsUseCase,
    filteresReportsUseCase,
    updateStatusUseCase,
    updateReportUseCase,
    notifyNearbyLostOwnersUseCase,
    followReportUseCase,
    unfollowReportUseCase,
    isFollowingReportUseCase,
);



router.post('/', requireAuth(tokenSigner), upload.array('photos', 5), validateRequest(createReportRequestSchema), createReportController.create)
router.get('/', requireAuth(tokenSigner), validateRequest(listUserReportsSchema), createReportController.list)
router.get('/filter', requireAuth(tokenSigner), validateRequest(getFilteredReportsSchema), createReportController.getFilteres)
router.get('/:publicId', createReportController.getByPublicId)
router.patch('/status/:publicId', requireAuth(tokenSigner), validateRequest(updateStatusReportSchema), createReportController.updateStatus)
router.patch('/:publicId', requireAuth(tokenSigner), upload.array('photos', 4), validateRequest(updateReportSchema), createReportController.update);
router.post('/:publicId/follow',requireAuth(tokenSigner),createReportController.follow,);
router.delete('/:publicId/follow',requireAuth(tokenSigner),createReportController.unfollow,);
router.get('/:publicId/follow',requireAuth(tokenSigner),createReportController.isFollowing,
);
export const createReportRoute = router