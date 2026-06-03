import { Router } from "express";
import prisma from "@infrastructure/prisma/prisma.client";
import { CreateReportController } from "../../controller/report.controller";
import { CreateReportUseCase } from "@application/usecase/report/create-report.usecase";
import { PrismaReportRepository } from "@infrastructure/repository/report/report.repository";
import { GetReportUseCase } from "@application/usecase/report/get-report-usecase";
import { ListUserReportsUseCase } from "@application/usecase/report/list-user-reports.usecase";
import { PrismaPetRepository } from "@infrastructure/repository/pet/pet.repository";
import { PrismaUserRepository } from "@infrastructure/repository/PrismaUserRepository";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import { readAuthConfig } from "src/presentation/config/authConfig";
import { JwtTokenSigner } from "src/infrastructure/security/JwtTokenSigner";
import upload from "@infrastructure/storage/CloudinaryMulterUpload";
import { ClaudinaryService } from "@infrastructure/storage/CloudinaryService";
import { GetFilteredReportsUseCase } from "@application/usecase/report/get-filter-reports.usecase";
import { validateRequest } from "src/presentation/middleware/validate.request";

import { getFilteredReportsSchema } from "src/presentation/schemas/report/report-filter.schema";
import { updateStatusReportSchema } from "src/presentation/schemas/report/update-status-report.schema";
import { UpdateStatus } from "@application/usecase/report/update-status-report";
import { createReportRequestSchema } from "src/presentation/schemas/report/create-report.schema";




const router = Router();
const { jwtSecret, accessTtl } = readAuthConfig();
const tokenSigner = new JwtTokenSigner(jwtSecret, accessTtl);
const repository = new PrismaReportRepository(prisma)
const petRepository = new PrismaPetRepository(prisma)
const userRepository = new PrismaUserRepository();
const storageService = new ClaudinaryService();
const createReportUseCase = new CreateReportUseCase(repository, userRepository, petRepository, storageService)
const getReportUseCase = new GetReportUseCase(repository, userRepository);
const filteresReportsUseCase = new GetFilteredReportsUseCase(repository);
const listUserReportsUseCase = new ListUserReportsUseCase(repository, petRepository);
const updateStatusUseCase = new UpdateStatus(repository);
const createReportController = new CreateReportController(createReportUseCase, getReportUseCase, listUserReportsUseCase, filteresReportsUseCase, updateStatusUseCase);


router.post('/', requireAuth(tokenSigner), upload.array('photos', 5), validateRequest(createReportRequestSchema), createReportController.create)
router.get('/', requireAuth(tokenSigner), createReportController.list)
router.get('/filter', requireAuth(tokenSigner), validateRequest(getFilteredReportsSchema), createReportController.getFilteres)
router.get('/:publicId', createReportController.getByPublicId)
router.patch('/status/:publicId', requireAuth(tokenSigner), validateRequest(updateStatusReportSchema), createReportController.updateStatus)
export const createReportRoute = router