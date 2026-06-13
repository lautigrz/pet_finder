import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "../../controller/AuthController";
import { validateRequest } from "../../middleware/validate.request";
import {
  loginRequestSchema,
  logoutRequestSchema,
  refreshRequestSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
} from "../../schemas/auth/auth.schema";
import { LoginUserUseCase } from "../../../application/usecase/login-user/login-user.usecase";
import { LogoutUserUseCase } from "../../../application/usecase/logout-user/logout-user.usecase";
import { RefreshAccessTokenUseCase } from "../../../application/usecase/refresh-access-token/refresh-access-token.usecase";
import { RequestPasswordResetUseCase } from "../../../application/usecase/request-password-reset/request-password-reset.usecase";
import { ResetPasswordUseCase } from "../../../application/usecase/reset-password/reset-password.usecase";
import { PrismaUserRepository } from "../../../infrastructure/repository/PrismaUserRepository";
import { PrismaRefreshTokenRepository } from "../../../infrastructure/repository/PrismaRefreshTokenRepository";
import { PrismaPasswordResetTokenRepository } from "../../../infrastructure/repository/PrismaPasswordResetTokenRepository";
import { BcryptPasswordHasher } from "../../../infrastructure/security/BcryptPasswordHasher";
import { CryptoTokenGenerator } from "../../../infrastructure/security/CryptoTokenGenerator";
import { JwtTokenSigner } from "../../../infrastructure/security/JwtTokenSigner";
import { createEmailService } from "../../../infrastructure/email/email-service.factory";
import { readAuthConfig } from "../../config/authConfig";

const router = Router();

const { jwtSecret, accessTtl, refreshTtlMs } = readAuthConfig();

const userRepository = new PrismaUserRepository();
const refreshTokenRepository = new PrismaRefreshTokenRepository();
const passwordResetTokenRepository = new PrismaPasswordResetTokenRepository();
const passwordHasher = new BcryptPasswordHasher();
const tokenGenerator = new CryptoTokenGenerator();
const tokenSigner = new JwtTokenSigner(jwtSecret, accessTtl);
const emailService = createEmailService();

const loginUserUseCase = new LoginUserUseCase(
  userRepository,
  refreshTokenRepository,
  passwordHasher,
  tokenSigner,
  tokenGenerator,
  refreshTtlMs,
);

const logoutUserUseCase = new LogoutUserUseCase(refreshTokenRepository);

const refreshAccessTokenUseCase = new RefreshAccessTokenUseCase(
  refreshTokenRepository,
  userRepository,
  tokenSigner,
);

const requestPasswordResetUseCase = new RequestPasswordResetUseCase(
  userRepository,
  passwordResetTokenRepository,
  tokenGenerator,
  emailService,
);

const resetPasswordUseCase = new ResetPasswordUseCase(
  passwordResetTokenRepository,
  userRepository,
  passwordHasher,
  refreshTokenRepository,
);

const authController = new AuthController(
  loginUserUseCase,
  logoutUserUseCase,
  refreshAccessTokenUseCase,
  requestPasswordResetUseCase,
  resetPasswordUseCase,
);

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
