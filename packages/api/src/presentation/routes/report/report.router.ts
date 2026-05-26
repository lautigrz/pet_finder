import { Router } from "express";
import prisma from "@infrastructure/prisma/prisma.client";
import { CreateReportController } from "../../controller/create-report.controller";
import { CreateReportUseCase } from "@application/usecase/create-report/create-report.usecase";
import { IReportRepository } from "@infrastructure/repository/report/report.repository";

const router = Router();

const repository = new IReportRepository(prisma)
const createReportUseCase = new CreateReportUseCase(repository)
const createReportController = new CreateReportController(createReportUseCase)

router.post('/', createReportController.create)

export const createReportRoute = router