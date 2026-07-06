import { Router } from "express";
import { container } from "tsyringe";
import { ITokenSigner } from "@domain/services/ITokenSigner";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import { validateRequest } from "src/presentation/middleware/validate.request";
import upload from "@infrastructure/storage/CloudinaryMulterUpload";
import { createPetRequestSchema } from "src/presentation/schemas/pet/pet.schema";
import { CreatePetController } from "@presentation/controller/pet/create-pet.controller";
import { GetUserPetsController } from "@presentation/controller/pet/get-user-pets.controller";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");

const createPet = container.resolve(CreatePetController);
const getUserPets = container.resolve(GetUserPetsController);

router.post("/", requireAuth(tokenSigner), upload.array("photos", 5), validateRequest(createPetRequestSchema), createPet.handle);
router.get("/", requireAuth(tokenSigner), getUserPets.handle);

export const createPetRoute = router;