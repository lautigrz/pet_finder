import { Router } from "express";
import { container } from "tsyringe";
import { MatchResultsController } from "../../controller/match-results.controller";
import { MatchViewsController } from "../../controller/match-views.controller";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import { validateRequest } from "src/presentation/middleware/validate.request";
import { markMatchSeenSchema } from "src/presentation/schemas/match/match-views.schema";
import { ITokenSigner } from "../../../domain/services/ITokenSigner";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const matchResultsController = container.resolve(MatchResultsController);
const matchViewsController = container.resolve(MatchViewsController);

router.get("/notifications", requireAuth(tokenSigner), matchResultsController.getMyNotifications);
router.get("/views", requireAuth(tokenSigner), matchViewsController.getSeen);
router.post("/:matchPublicId/seen", requireAuth(tokenSigner), validateRequest(markMatchSeenSchema), matchViewsController.markSeen);
router.get("/:publicId", matchResultsController.getMatchResults);

export const matchRouter = router;
