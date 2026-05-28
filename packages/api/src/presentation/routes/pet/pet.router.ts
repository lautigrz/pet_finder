import { Router } from "express";
import prisma from "@infrastructure/prisma/prisma.client";
import { PrismaPetRepository } from "@infrastructure/repository/pet/pet.repository";
import { CreatePetUseCase } from "@application/usecase/pet-usecase/create-pet.usecase";
import { PetController } from "src/presentation/controller/pet.controller";
import { GetPetsUseCase } from "@application/usecase/pet-usecase/get-user-pets.usecase";

const router = Router();

const repository = new PrismaPetRepository(prisma);
const createPetUseCase = new CreatePetUseCase(repository)
const getPetsUseCase = new GetPetsUseCase(repository);
const createPetController = new PetController(createPetUseCase, getPetsUseCase);

router.post('/', createPetController.create)
router.get('/', createPetController.getAllByUserId)

export const createPetRoute = router