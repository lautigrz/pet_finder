import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "../../controller/AuthController";
import { LoginUserUseCase } from "../../../application/usecase/login-user/login-user.usecase";
import { PrismaUserRepository } from "../../../infrastructure/repository/PrismaUserRepository";
import { PrismaRefreshTokenRepository } from "../../../infrastructure/repository/PrismaRefreshTokenRepository";
import { BcryptPasswordHasher } from "../../../infrastructure/security/BcryptPasswordHasher";
import { CryptoTokenGenerator } from "../../../infrastructure/security/CryptoTokenGenerator";
import { JwtTokenSigner } from "../../../infrastructure/security/JwtTokenSigner";
import { readAuthConfig } from "../../config/authConfig";

const router = Router();

const { jwtSecret, accessTtl, refreshTtlMs } = readAuthConfig();

const userRepository = new PrismaUserRepository();
const refreshTokenRepository = new PrismaRefreshTokenRepository();
const passwordHasher = new BcryptPasswordHasher();
const tokenGenerator = new CryptoTokenGenerator();
const tokenSigner = new JwtTokenSigner(jwtSecret, accessTtl);

const loginUserUseCase = new LoginUserUseCase(
  userRepository,
  refreshTokenRepository,
  passwordHasher,
  tokenSigner,
  tokenGenerator,
  refreshTtlMs,
);

const authController = new AuthController(loginUserUseCase);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, authController.login);

export default router;
