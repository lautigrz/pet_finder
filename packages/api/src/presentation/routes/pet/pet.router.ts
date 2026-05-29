import { Router } from "express";
import prisma from "@infrastructure/prisma/prisma.client";
import { PrismaPetRepository } from "@infrastructure/repository/pet/pet.repository";
import { CreatePetUseCase } from "@application/usecase/pet-usecase/create-pet.usecase";
import { PetController } from "src/presentation/controller/pet.controller";
import { GetPetsUseCase } from "@application/usecase/pet-usecase/get-user-pets.usecase";
import { readAuthConfig } from "src/presentation/config/authConfig";
import { JwtTokenSigner } from "@infrastructure/security/JwtTokenSigner";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";

const router = Router();
const { jwtSecret, accessTtl } = readAuthConfig();
const tokenSigner = new JwtTokenSigner(jwtSecret, accessTtl);
const repository = new PrismaPetRepository(prisma);
const createPetUseCase = new CreatePetUseCase(repository)
const getPetsUseCase = new GetPetsUseCase(repository);
const createPetController = new PetController(createPetUseCase, getPetsUseCase);

router.post('/', requireAuth(tokenSigner), createPetController.create)
router.get('/', requireAuth(tokenSigner), createPetController.getAllByUserId)

export const createPetRoute = router