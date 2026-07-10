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
  updateCurrentLocationRequestSchema,
  createUserReviewRequestSchema,
  listUserReviewsRequestSchema,
} from "@presentation/schemas/user/user.schema";
import upload from "@infrastructure/storage/CloudinaryMulterUpload";
import { CreateUserController } from "@presentation/controller/user/create-user.controller";
import { VerifyEmailController } from "@presentation/controller/user/verify-email.controller";
import { UpdateProfileController } from "@presentation/controller/user/update-profile.controller";
import { UpdateCurrentLocationController } from "@presentation/controller/user/update-current-location.controller";
import { GetProfileController } from "@presentation/controller/user/get-profile.controller";
import { GetPublicProfileController } from "@presentation/controller/user/get-public-profile.controller";
import { UploadProfilePhotoController } from "@presentation/controller/user/upload-profile-photo.controller";
import { GetNotificationPreferencesController } from "@presentation/controller/user/get-notification-preferences.controller";
import { UpdateNotificationPreferencesController } from "@presentation/controller/user/update-notification-preferences.controller";
import { UpsertUserReviewController } from "@presentation/controller/user-review/upsert-user-review.controller";
import { ListUserReviewsController } from "@presentation/controller/user-review/list-user-reviews.controller";
import { ListPublicUserReviewsController } from "@presentation/controller/user-review/list-public-user-reviews.controller";
import { GetUserRatingController } from "@presentation/controller/user-review/get-user-rating.controller";
import { GetUserExperienceController } from "@presentation/controller/user/get-user-experience.controller";
import { GetPublicUserExperienceController } from "@presentation/controller/user/get-public-user-experience.controller";

const router = Router();

const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const createUserController = container.resolve(CreateUserController);
const verifyEmailController = container.resolve(VerifyEmailController);
const updateProfileController = container.resolve(UpdateProfileController);
const updateCurrentLocationController = container.resolve(UpdateCurrentLocationController);
const getProfileController = container.resolve(GetProfileController);
const getPublicProfileController = container.resolve(GetPublicProfileController);
const uploadProfilePhotoController = container.resolve(UploadProfilePhotoController);
const getNotificationPreferencesController = container.resolve(GetNotificationPreferencesController);
const updateNotificationPreferencesController = container.resolve(UpdateNotificationPreferencesController);
const upsertUserReviewController = container.resolve(UpsertUserReviewController);
const listUserReviewsController = container.resolve(ListUserReviewsController);
const listPublicUserReviewsController = container.resolve(ListPublicUserReviewsController);
const getUserRatingController = container.resolve(GetUserRatingController);
const getUserExperienceController = container.resolve(GetUserExperienceController);
const getPublicUserExperienceController = container.resolve(GetPublicUserExperienceController);

router.post("/", validateRequest(createUserRequestSchema), createUserController.handle);
router.post("/verify-email", validateRequest(verifyEmailRequestSchema), verifyEmailController.handle);
router.patch("/me", requireAuth(tokenSigner), validateRequest(updateProfileRequestSchema), updateProfileController.handle);
router.patch("/me/location", requireAuth(tokenSigner), validateRequest(updateCurrentLocationRequestSchema), updateCurrentLocationController.handle);
router.get("/me/reviews", requireAuth(tokenSigner), validateRequest(listUserReviewsRequestSchema), listUserReviewsController.handle);
router.get("/me", requireAuth(tokenSigner), getProfileController.handle);
router.get("/me/xp", requireAuth(tokenSigner), getUserExperienceController.handle);
router.post("/me/photo", requireAuth(tokenSigner), upload.single("photo"), uploadProfilePhotoController.handle);
router.get("/preferences", requireAuth(tokenSigner), getNotificationPreferencesController.handle);
router.patch("/preferences",requireAuth(tokenSigner),validateRequest(updateNotificationPreferencesRequestSchema),updateNotificationPreferencesController.handle,);
router.get("/:publicId/profile",requireAuth(tokenSigner),getPublicProfileController.handle,);
router.post("/:publicId/reviews",requireAuth(tokenSigner),validateRequest(createUserReviewRequestSchema),upsertUserReviewController.handle,);
router.get("/:publicId/reviews",requireAuth(tokenSigner),validateRequest(listUserReviewsRequestSchema),listPublicUserReviewsController.handle,);
router.get("/:publicId/rating",requireAuth(tokenSigner),getUserRatingController.handle,);
router.get("/:publicId/xp",requireAuth(tokenSigner),getPublicUserExperienceController.handle,);
router.get("/:publicId",requireAuth(tokenSigner),getPublicProfileController.handle,);

export default router;
