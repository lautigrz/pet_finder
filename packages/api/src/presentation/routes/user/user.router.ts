import { Router } from "express";
import { UserController } from "../../controller/UserController";
import { CreateUserUseCase } from "../../../application/usecase/create-user/create-user.usecase";
import { SendEmailVerificationUseCase } from "../../../application/usecase/send-email-verification/send-email-verification.usecase";
import { VerifyEmailUseCase } from "../../../application/usecase/verify-email/verify-email.usecase";
import { PrismaUserRepository } from "../../../infrastructure/repository/PrismaUserRepository";
import { PrismaEmailVerificationTokenRepository } from "../../../infrastructure/repository/PrismaEmailVerificationTokenRepository";
import { BcryptPasswordHasher } from "../../../infrastructure/security/BcryptPasswordHasher";
import { CryptoTokenGenerator } from "../../../infrastructure/security/CryptoTokenGenerator";
import { createEmailService } from "../../../infrastructure/email/email-service.factory";
import { UpdateProfileUseCase } from "../../../application/usecase/update-profile/update-profile.usecase";
import { JwtTokenSigner } from "../../../infrastructure/security/JwtTokenSigner";
import { readAuthConfig } from "../../config/authConfig";
import { requireAuth } from "../../middleware/requireAuth.middleware";
import { GetProfileUseCase } from "../../../application/usecase/get-profile/get-profile.usecase";
import { ClaudinaryService } from "../../../infrastructure/storage/CloudinaryService";
import { PrismaNotificationPreferencesRepository } from "../../../infrastructure/repository/PrismaNotificationPreferencesRepository";
import { UpdateNotificationPreferencesUseCase } from "../../../application/usecase/update-notification-preferences/update-notification-preferences.usecase";
import { GetNotificationPreferencesUseCase } from "../../../application/usecase/get-notification-preferences/get-notification-preferences.usecase";
import upload from "../../../infrastructure/storage/CloudinaryMulterUpload";




const router = Router();

const userRepository = new PrismaUserRepository();
const tokenRepository = new PrismaEmailVerificationTokenRepository();
const passwordHasher = new BcryptPasswordHasher();
const tokenGenerator = new CryptoTokenGenerator();
const emailService = createEmailService();
const { jwtSecret, accessTtl } = readAuthConfig();
const tokenSigner = new JwtTokenSigner(jwtSecret, accessTtl);
const updateProfileUseCase = new UpdateProfileUseCase(userRepository);
const getProfileUseCase = new GetProfileUseCase(userRepository);
const cloudinaryService = new ClaudinaryService();
const notificationPreferencesRepository = new PrismaNotificationPreferencesRepository();
const updateNotificationsPreferenceUseCase = new UpdateNotificationPreferencesUseCase(notificationPreferencesRepository);
const getNotificationPreferencesUseCase = new GetNotificationPreferencesUseCase(notificationPreferencesRepository);

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
  getProfileUseCase,
  cloudinaryService,
  updateNotificationsPreferenceUseCase,
  getNotificationPreferencesUseCase
);

router.post("/", userController.create);
router.post("/verify-email", userController.verifyEmail);
router.patch("/me", requireAuth(tokenSigner), userController.updateProfile);
router.get("/me", requireAuth(tokenSigner), userController.getProfile);
router.post("/me/photo", requireAuth(tokenSigner), upload.single("photo"), userController.uploadProfilePhoto);
router.get("/preferences", requireAuth(tokenSigner), userController.getNotificationPreferences);
router.patch("/preferences", requireAuth(tokenSigner), userController.updateNotificationPreferences);

export default router;
