import { Router } from "express";
import { container } from "tsyringe";
import { MatchResultsController } from "../../controller/match-results.controller";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import { ITokenSigner } from "../../../domain/services/ITokenSigner";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const matchResultsController = container.resolve(MatchResultsController);

router.get("/notifications", requireAuth(tokenSigner), matchResultsController.getMyNotifications);
router.get("/:publicId", matchResultsController.getMatchResults);

export const matchRouter = router;