import { Router } from "express";
import { UserController } from "../../controller/UserController";
import { RegisterUserUseCase } from "../../../application/usecase/register-user/register-user.usecase";
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
import { validateRequest } from "../../middleware/validate.request";
import { createUserRequestSchema, verifyEmailRequestSchema } from "../../schemas/user/user.schema";
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

const registerUserUseCase = new RegisterUserUseCase(
  userRepository,
  passwordHasher,
  tokenRepository,
  tokenGenerator,
  emailService,
);
const verifyEmailUseCase = new VerifyEmailUseCase(userRepository, tokenRepository);

const userController = new UserController(
  registerUserUseCase,
  verifyEmailUseCase,
  updateProfileUseCase,
  getProfileUseCase,
  cloudinaryService,
  updateNotificationsPreferenceUseCase,
  getNotificationPreferencesUseCase
);

router.post("/", validateRequest(createUserRequestSchema), userController.create);
router.post("/verify-email", validateRequest(verifyEmailRequestSchema), userController.verifyEmail);
router.patch("/me", requireAuth(tokenSigner), userController.updateProfile);
router.get("/me", requireAuth(tokenSigner), userController.getProfile);
router.post("/me/photo", requireAuth(tokenSigner), upload.single("photo"), userController.uploadProfilePhoto);
router.get("/preferences", requireAuth(tokenSigner), userController.getNotificationPreferences);
router.patch("/preferences", requireAuth(tokenSigner), userController.updateNotificationPreferences);

export default router;
