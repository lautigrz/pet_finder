import { Router } from "express";
import { MatchResultsController } from "../../controller/match-results.controller";
import { MatchResultsRepository } from "@domain/match/repositories/match-results.repository";
import { GetMatchResultsUseCase } from "@application/usecase/match-results-usecase/get-match-results.usecase";
import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { PrismaReportRepository } from "@infrastructure/repository/report/report.repository";
import prisma from "@infrastructure/prisma/prisma.client";
import { PrismaMatchResultsRepository } from "@infrastructure/repository/match/match-results.repository";

const router = Router();
const reportRepository = new PrismaReportRepository(prisma)
const matchRepository = new PrismaMatchResultsRepository(prisma);
const getMatchResultsUseCase = new GetMatchResultsUseCase(
    matchRepository,
    reportRepository
);

const matchResultsController = new MatchResultsController(getMatchResultsUseCase);
router.get("/:publicId", matchResultsController.getMatchResults);

export const matchRouter = router;