import { Router } from "express";
import { container } from "tsyringe";
import { ITokenSigner } from "@domain/services/ITokenSigner";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import { validateRequest } from "src/presentation/middleware/validate.request";
import { markMatchSeenSchema } from "src/presentation/schemas/match/match-views.schema";
import { GetMatchResultsController } from "@presentation/controller/match/get-match-results.controller";
import { GetMatchNotificationsController } from "@presentation/controller/match/get-match-notifications.controller";
import { MarkMatchSeenController } from "@presentation/controller/match/mark-match-seen.controller";
import { GetSeenMatchesController } from "@presentation/controller/match/get-seen-matches.controller";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");

const getMatchResults = container.resolve(GetMatchResultsController);
const getMatchNotifications = container.resolve(GetMatchNotificationsController);
const markMatchSeen = container.resolve(MarkMatchSeenController);
const getSeenMatches = container.resolve(GetSeenMatchesController);

router.get("/notifications", requireAuth(tokenSigner), getMatchNotifications.handle);
router.get("/views", requireAuth(tokenSigner), getSeenMatches.handle);
router.post("/:matchPublicId/seen", requireAuth(tokenSigner), validateRequest(markMatchSeenSchema), markMatchSeen.handle);
router.get("/:publicId", getMatchResults.handle);

export const matchRouter = router;
