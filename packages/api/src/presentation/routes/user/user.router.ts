import { Router } from "express";
import { UserController } from "../../controller/UserController";
import { CreateUserUseCase } from "../../../application/usecase/create-user/create-user.usecase";
import { SendEmailVerificationUseCase } from "../../../application/usecase/send-email-verification/send-email-verification.usecase";
import { VerifyEmailUseCase } from "../../../application/usecase/verify-email/verify-email.usecase";
import { PrismaUserRepository } from "../../../infrastructure/repository/PrismaUserRepository";
import { PrismaEmailVerificationTokenRepository } from "../../../infrastructure/repository/PrismaEmailVerificationTokenRepository";
import { BcryptPasswordHasher } from "../../../infrastructure/security/BcryptPasswordHasher";
import { CryptoTokenGenerator } from "../../../infrastructure/security/CryptoTokenGenerator";
import { LogEmailService } from "../../../infrastructure/email/LogEmailService";
import { UpdateProfileUseCase } from "../../../application/usecase/update-profile/update-profile.usecase";
import { JwtTokenSigner } from "../../../infrastructure/security/JwtTokenSigner";
import { readAuthConfig } from "../../config/authConfig";
import { requireAuth } from "../../middleware/requireAuth.middleware";

const router = Router();

const userRepository = new PrismaUserRepository();
const tokenRepository = new PrismaEmailVerificationTokenRepository();
const passwordHasher = new BcryptPasswordHasher();
const tokenGenerator = new CryptoTokenGenerator();
const emailService = new LogEmailService();
const { jwtSecret, accessTtl } = readAuthConfig();
const tokenSigner = new JwtTokenSigner(jwtSecret, accessTtl);
const updateProfileUseCase = new UpdateProfileUseCase(userRepository);


const createUserUseCase = new CreateUserUseCase(userRepository, passwordHasher);
const sendEmailVerificationUseCase = new SendEmailVerificationUseCase(
  tokenRepository,
  tokenGenerator,
  emailService,
);
const verifyEmailUseCase = new VerifyEmailUseCase(userRepository, tokenRepository);

const userController = new UserController(
  createUserUseCase,
  sendEmailVerificationUseCase,
  verifyEmailUseCase,
  updateProfileUseCase,
);

router.post("/", userController.create);
router.post("/verify-email", userController.verifyEmail);
router.patch("/me", requireAuth(tokenSigner), userController.updateProfile);

export default router;
