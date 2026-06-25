import { Router } from "express";
import rateLimit from "express-rate-limit";
import { container } from "tsyringe";
import { AuthController } from "../../controller/AuthController";
import { ITokenSigner } from "../../../domain/services/ITokenSigner";
import { requireAuth } from "../../middleware/requireAuth.middleware";
import { validateRequest } from "../../middleware/validate.request";
import {
  loginRequestSchema,
  logoutRequestSchema,
  refreshRequestSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
} from "../../schemas/auth/auth.schema";

const router = Router();

const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const authController = container.resolve(AuthController);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: "Too many password reset requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, validateRequest(loginRequestSchema), authController.login);
router.post("/logout", validateRequest(logoutRequestSchema), authController.logout);
router.post("/refresh", validateRequest(refreshRequestSchema), authController.refresh);
router.post("/forgot-password", passwordResetLimiter, validateRequest(forgotPasswordRequestSchema), authController.forgotPassword);
router.post("/reset-password", validateRequest(resetPasswordRequestSchema), authController.resetPassword);

export default router;
