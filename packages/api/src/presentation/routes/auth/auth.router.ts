import { Router } from "express";
import { container } from "tsyringe";
import rateLimit from "express-rate-limit";
import { ITokenSigner } from "@domain/services/ITokenSigner";
import { requireAuth } from "@presentation/middleware/requireAuth.middleware";
import { validateRequest } from "@presentation/middleware/validate.request";
import {
  loginRequestSchema,
  logoutRequestSchema,
  refreshRequestSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
  googleLoginRequestSchema,
} from "@presentation/schemas/auth/auth.schema";
import { LoginController } from "@presentation/controller/auth/login.controller";
import { GoogleLoginController } from "@presentation/controller/auth/google-login.controller";
import { LogoutController } from "@presentation/controller/auth/logout.controller";
import { RefreshTokenController } from "@presentation/controller/auth/refresh-token.controller";
import { ForgotPasswordController } from "@presentation/controller/auth/forgot-password.controller";
import { ResetPasswordController } from "@presentation/controller/auth/reset-password.controller";

const router = Router();

const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const loginController = container.resolve(LoginController);
const googleLoginController = container.resolve(GoogleLoginController);
const logoutController = container.resolve(LogoutController);
const refreshTokenController = container.resolve(RefreshTokenController);
const forgotPasswordController = container.resolve(ForgotPasswordController);
const resetPasswordController = container.resolve(ResetPasswordController);

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

router.post("/login", loginLimiter, validateRequest(loginRequestSchema), loginController.handle);
router.post("/google", loginLimiter, validateRequest(googleLoginRequestSchema), googleLoginController.handle);
router.post("/logout", validateRequest(logoutRequestSchema), logoutController.handle);
router.post("/refresh", validateRequest(refreshRequestSchema), refreshTokenController.handle);
router.post("/forgot-password", passwordResetLimiter, validateRequest(forgotPasswordRequestSchema), forgotPasswordController.handle);
router.post("/reset-password", validateRequest(resetPasswordRequestSchema), resetPasswordController.handle);

export default router;
