import { Router } from "express";
import { container } from "tsyringe";
import { ITokenSigner } from "@domain/services/ITokenSigner";
import { requireAuth } from "@presentation/middleware/requireAuth.middleware";
import { validateRequest } from "@presentation/middleware/validate.request";
import {
  createUserRequestSchema,
  verifyEmailRequestSchema,
  updateProfileRequestSchema,
  updateNotificationPreferencesRequestSchema,
} from "@presentation/schemas/user/user.schema";
import upload from "@infrastructure/storage/CloudinaryMulterUpload";
import { CreateUserController } from "@presentation/controller/user/create-user.controller";
import { VerifyEmailController } from "@presentation/controller/user/verify-email.controller";
import { UpdateProfileController } from "@presentation/controller/user/update-profile.controller";
import { GetProfileController } from "@presentation/controller/user/get-profile.controller";
import { UploadProfilePhotoController } from "@presentation/controller/user/upload-profile-photo.controller";
import { GetNotificationPreferencesController } from "@presentation/controller/user/get-notification-preferences.controller";
import { UpdateNotificationPreferencesController } from "@presentation/controller/user/update-notification-preferences.controller";

const router = Router();

const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const createUserController = container.resolve(CreateUserController);
const verifyEmailController = container.resolve(VerifyEmailController);
const updateProfileController = container.resolve(UpdateProfileController);
const getProfileController = container.resolve(GetProfileController);
const uploadProfilePhotoController = container.resolve(UploadProfilePhotoController);
const getNotificationPreferencesController = container.resolve(GetNotificationPreferencesController);
const updateNotificationPreferencesController = container.resolve(UpdateNotificationPreferencesController);

router.post("/", validateRequest(createUserRequestSchema), createUserController.handle);
router.post("/verify-email", validateRequest(verifyEmailRequestSchema), verifyEmailController.handle);
router.patch("/me", requireAuth(tokenSigner), validateRequest(updateProfileRequestSchema), updateProfileController.handle);
router.get("/me", requireAuth(tokenSigner), getProfileController.handle);
router.post("/me/photo", requireAuth(tokenSigner), upload.single("photo"), uploadProfilePhotoController.handle);
router.get("/preferences", requireAuth(tokenSigner), getNotificationPreferencesController.handle);
router.patch("/preferences", requireAuth(tokenSigner), validateRequest(updateNotificationPreferencesRequestSchema), updateNotificationPreferencesController.handle);

export default router;
