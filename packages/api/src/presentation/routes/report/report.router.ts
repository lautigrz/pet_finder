import { Router } from "express";
import { container } from "tsyringe";
import { CreateReportController } from "../../controller/report.controller";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import upload from "@infrastructure/storage/CloudinaryMulterUpload";
import { validateRequest } from "src/presentation/middleware/validate.request";
import { getFilteredReportsSchema } from "src/presentation/schemas/report/report-filter.schema";
import { listUserReportsSchema } from "src/presentation/schemas/report/list-user-reports.schema";
import { updateStatusReportSchema } from "src/presentation/schemas/report/update-status-report.schema";
import { createReportRequestSchema } from "src/presentation/schemas/report/create-report.schema";
import { updateReportSchema } from 'src/presentation/schemas/report/update-report.schema';
import { ITokenSigner } from "../../../domain/services/ITokenSigner";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");
const createReportController = container.resolve(CreateReportController);

router.post('/', requireAuth(tokenSigner), upload.array('photos', 5), validateRequest(createReportRequestSchema), createReportController.create)
router.get('/', requireAuth(tokenSigner), validateRequest(listUserReportsSchema), createReportController.list)
router.get('/filter', requireAuth(tokenSigner), validateRequest(getFilteredReportsSchema), createReportController.getFilteres)
router.get('/:publicId', createReportController.getByPublicId)
router.patch('/status/:publicId', requireAuth(tokenSigner), validateRequest(updateStatusReportSchema), createReportController.updateStatus)
router.patch('/:publicId', requireAuth(tokenSigner), upload.array('photos', 4), validateRequest(updateReportSchema), createReportController.update);
router.post('/:publicId/follow',requireAuth(tokenSigner),createReportController.follow,);
router.delete('/:publicId/follow',requireAuth(tokenSigner),createReportController.unfollow,);
router.get('/:publicId/follow',requireAuth(tokenSigner),createReportController.isFollowing,
);

export const createReportRoute = router;