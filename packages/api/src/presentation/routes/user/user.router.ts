import { Router } from "express";
import { container } from "tsyringe";
import { UserController } from "../../controller/UserController";
import { ITokenSigner } from "../../../domain/services/ITokenSigner";
import { requireAuth } from "../../middleware/requireAuth.middleware";
import { validateRequest } from "../../middleware/validate.request";
import { createUserRequestSchema, verifyEmailRequestSchema } from "../../schemas/user/user.schema";
import upload from "../../../infrastructure/storage/CloudinaryMulterUpload";

const router = Router();

const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const userController = container.resolve(UserController);

router.post("/", validateRequest(createUserRequestSchema), userController.create);
router.post("/verify-email", validateRequest(verifyEmailRequestSchema), userController.verifyEmail);
router.patch("/me", requireAuth(tokenSigner), userController.updateProfile);
router.get("/me", requireAuth(tokenSigner), userController.getProfile);
router.post("/me/photo", requireAuth(tokenSigner), upload.single("photo"), userController.uploadProfilePhoto);
router.get("/preferences", requireAuth(tokenSigner), userController.getNotificationPreferences);
router.patch("/preferences", requireAuth(tokenSigner), userController.updateNotificationPreferences);

export default router;
