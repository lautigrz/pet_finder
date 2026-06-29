import { Router } from "express";
import { container } from "tsyringe";
import { CatalogController } from "src/presentation/controller/catalog.controller";
import { ITokenSigner } from "../../../domain/services/ITokenSigner";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import { validateRequest } from "src/presentation/middleware/validate.request";
import { getBreedsRequestSchema } from "src/presentation/schemas/catalog/catalog.schema";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const controller = container.resolve(CatalogController);

router.get("/breeds", requireAuth(tokenSigner), validateRequest(getBreedsRequestSchema), controller.getBreeds);
router.get("/colors", requireAuth(tokenSigner), controller.getColors);

export const catalogRouter = router;
