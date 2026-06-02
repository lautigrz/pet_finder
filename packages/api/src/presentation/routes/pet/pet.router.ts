import { Router } from "express";
import prisma from "@infrastructure/prisma/prisma.client";
import { PrismaPetRepository } from "@infrastructure/repository/pet/pet.repository";
import { PrismaUserRepository } from "@infrastructure/repository/PrismaUserRepository";
import { CreatePetUseCase } from "@application/usecase/pet-usecase/create-pet.usecase";
import { PetController } from "src/presentation/controller/pet.controller";
import { GetPetsUseCase } from "@application/usecase/pet-usecase/get-user-pets.usecase";
import { readAuthConfig } from "src/presentation/config/authConfig";
import { JwtTokenSigner } from "@infrastructure/security/JwtTokenSigner";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import upload from "@infrastructure/storage/CloudinaryMulterUpload";
import { ClaudinaryService } from "@infrastructure/storage/CloudinaryService";
import { validateRequest } from "src/presentation/middleware/validate.request";
import { createPetRequestSchema, petSchema } from "src/presentation/schemas/pet/pet.schema";

const router = Router();
const { jwtSecret, accessTtl } = readAuthConfig();
const tokenSigner = new JwtTokenSigner(jwtSecret, accessTtl);
const petRepository = new PrismaPetRepository(prisma);
const userRepository = new PrismaUserRepository();
const storageService = new ClaudinaryService();
const createPetUseCase = new CreatePetUseCase(petRepository, storageService, userRepository);
const getPetsUseCase = new GetPetsUseCase(petRepository, userRepository);
const createPetController = new PetController(createPetUseCase, getPetsUseCase);

router.post('/', requireAuth(tokenSigner), upload.array('photos', 5), validateRequest(createPetRequestSchema), createPetController.create)
router.get('/', requireAuth(tokenSigner), createPetController.getAllByUserId)

export const createPetRoute = router