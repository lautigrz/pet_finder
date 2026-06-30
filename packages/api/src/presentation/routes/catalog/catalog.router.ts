import { Router } from "express";
import { container } from "tsyringe";
import { ITokenSigner } from "@domain/services/ITokenSigner";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import { validateRequest } from "src/presentation/middleware/validate.request";
import { getBreedsRequestSchema } from "src/presentation/schemas/catalog/catalog.schema";
import { GetBreedsController } from "@presentation/controller/catalog/get-breeds.controller";
import { GetColorsController } from "@presentation/controller/catalog/get-colors.controller";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");

const getBreeds = container.resolve(GetBreedsController);
const getColors = container.resolve(GetColorsController);

router.get("/breeds", requireAuth(tokenSigner), validateRequest(getBreedsRequestSchema), getBreeds.handle);
router.get("/colors", requireAuth(tokenSigner), getColors.handle);

export const catalogRouter = router;
