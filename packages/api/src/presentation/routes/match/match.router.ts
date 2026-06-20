import { Router } from "express";
import { MatchResultsController } from "../../controller/match-results.controller";
import { GetMatchResultsUseCase } from "@application/usecase/match-results-usecase/get-match-results.usecase";
import { GetUserMatchNotificationsUseCase } from "@application/usecase/match-results-usecase/get-user-match-notifications.usecase";
import { PrismaReportRepository } from "@infrastructure/repository/report/report.repository";
import prisma from "@infrastructure/prisma/prisma.client";
import { PrismaMatchResultsRepository } from "@infrastructure/repository/match/match-results.repository";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import { readAuthConfig } from "src/presentation/config/authConfig";
import { JwtTokenSigner } from "src/infrastructure/security/JwtTokenSigner";

const router = Router();
const { jwtSecret, accessTtl } = readAuthConfig();
const tokenSigner = new JwtTokenSigner(jwtSecret, accessTtl);
const reportRepository = new PrismaReportRepository(prisma)
const matchRepository = new PrismaMatchResultsRepository(prisma);
const getMatchResultsUseCase = new GetMatchResultsUseCase(
    matchRepository,
    reportRepository
);
const getUserMatchNotificationsUseCase = new GetUserMatchNotificationsUseCase(matchRepository);

const matchResultsController = new MatchResultsController(
    getMatchResultsUseCase,
    getUserMatchNotificationsUseCase,
);

router.get("/notifications", requireAuth(tokenSigner), matchResultsController.getMyNotifications);
router.get("/:publicId", matchResultsController.getMatchResults);

export const matchRouter = router;