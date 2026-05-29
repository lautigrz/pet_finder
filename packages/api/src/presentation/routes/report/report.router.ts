import { Router } from "express";
import prisma from "@infrastructure/prisma/prisma.client";
import { CreateReportController } from "../../controller/report.controller";
import { CreateReportUseCase } from "@application/usecase/report/create-report.usecase";
import { PrismaReportRepository } from "@infrastructure/repository/report/report.repository";
import { GetReportUseCase } from "@application/usecase/report/get-report-usecase";
import { PrismaPetRepository } from "@infrastructure/repository/pet/pet.repository";
import { PrismaUserRepository } from "@infrastructure/repository/PrismaUserRepository";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import { readAuthConfig } from "src/presentation/config/authConfig";
import { JwtTokenSigner } from "src/infrastructure/security/JwtTokenSigner";


const router = Router();
const { jwtSecret, accessTtl } = readAuthConfig();
const tokenSigner = new JwtTokenSigner(jwtSecret, accessTtl);
const repository = new PrismaReportRepository(prisma)
const petRepository = new PrismaPetRepository(prisma)
const userRepository = new PrismaUserRepository();
const createReportUseCase = new CreateReportUseCase(repository, userRepository, petRepository)
const getReportUseCase = new GetReportUseCase(repository, petRepository);
const createReportController = new CreateReportController(createReportUseCase, getReportUseCase);

router.post('/', requireAuth(tokenSigner), createReportController.create)
router.get('/:publicId', createReportController.getByPublicId)

export const createReportRoute = router