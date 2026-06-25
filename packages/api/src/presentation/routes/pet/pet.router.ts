import { Router } from "express";
import { container } from "tsyringe";
import { PetController } from "src/presentation/controller/pet.controller";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import upload from "@infrastructure/storage/CloudinaryMulterUpload";
import { validateRequest } from "src/presentation/middleware/validate.request";
import { createPetRequestSchema } from "src/presentation/schemas/pet/pet.schema";
import { ITokenSigner } from "../../../domain/services/ITokenSigner";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const createPetController = container.resolve(PetController);

router.post('/', requireAuth(tokenSigner), upload.array('photos', 5), validateRequest(createPetRequestSchema), createPetController.create)
router.get('/', requireAuth(tokenSigner), createPetController.getAllByUserId)

export const createPetRoute = router;