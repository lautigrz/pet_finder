import { Router } from "express";
import prisma from "@infrastructure/prisma/prisma.client";
import { PrismaCatalogRepository } from "@infrastructure/repository/catalog/catalog.repository";
import { GetBreedsUseCase } from "@application/usecase/catalog/get-breeds.usecase";
import { GetColorsUseCase } from "@application/usecase/catalog/get-colors.usecase";
import { CatalogController } from "src/presentation/controller/catalog.controller";
import { readAuthConfig } from "src/presentation/config/authConfig";
import { JwtTokenSigner } from "@infrastructure/security/JwtTokenSigner";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";

const router = Router();
const { jwtSecret, accessTtl } = readAuthConfig();
const tokenSigner = new JwtTokenSigner(jwtSecret, accessTtl);

const catalogRepository = new PrismaCatalogRepository(prisma);
const getBreedsUseCase = new GetBreedsUseCase(catalogRepository);
const getColorsUseCase = new GetColorsUseCase(catalogRepository);
const controller = new CatalogController(getBreedsUseCase, getColorsUseCase);

router.get("/breeds", requireAuth(tokenSigner), controller.getBreeds);
router.get("/colors", requireAuth(tokenSigner), controller.getColors);

export const catalogRouter = router;
