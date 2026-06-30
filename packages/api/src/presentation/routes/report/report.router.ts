import { Router } from "express";
import { container } from "tsyringe";
import { ITokenSigner } from "@domain/services/ITokenSigner";
import { requireAuth } from "src/presentation/middleware/requireAuth.middleware";
import { validateRequest } from "src/presentation/middleware/validate.request";
import upload from "@infrastructure/storage/CloudinaryMulterUpload";
import { createReportRequestSchema } from "src/presentation/schemas/report/create-report.schema";
import { listUserReportsSchema } from "src/presentation/schemas/report/list-user-reports.schema";
import { getFilteredReportsSchema } from "src/presentation/schemas/report/report-filter.schema";
import { updateStatusReportSchema } from "src/presentation/schemas/report/update-status-report.schema";
import { updateReportSchema } from "src/presentation/schemas/report/update-report.schema";
import { CreateReportController } from "@presentation/controller/report/create-report.controller";
import { GetReportController } from "@presentation/controller/report/get-report.controller";
import { ListUserReportsController } from "@presentation/controller/report/list-user-reports.controller";
import { GetFilteredReportsController } from "@presentation/controller/report/get-filtered-reports.controller";
import { UpdateReportController } from "@presentation/controller/report/update-report.controller";
import { UpdateReportStatusController } from "@presentation/controller/report/update-report-status.controller";
import { FollowReportController } from "@presentation/controller/report/follow-report.controller";
import { UnfollowReportController } from "@presentation/controller/report/unfollow-report.controller";
import { IsFollowingReportController } from "@presentation/controller/report/is-following-report.controller";

const router = Router();
const tokenSigner = container.resolve<ITokenSigner>("TokenSigner");

const createReport = container.resolve(CreateReportController);
const getReport = container.resolve(GetReportController);
const listUserReports = container.resolve(ListUserReportsController);
const getFilteredReports = container.resolve(GetFilteredReportsController);
const updateReport = container.resolve(UpdateReportController);
const updateReportStatus = container.resolve(UpdateReportStatusController);
const followReport = container.resolve(FollowReportController);
const unfollowReport = container.resolve(UnfollowReportController);
const isFollowingReport = container.resolve(IsFollowingReportController);

router.post("/", requireAuth(tokenSigner), upload.array("photos", 5), validateRequest(createReportRequestSchema), createReport.handle);
router.get("/", requireAuth(tokenSigner), validateRequest(listUserReportsSchema), listUserReports.handle);
router.get("/filter", requireAuth(tokenSigner), validateRequest(getFilteredReportsSchema), getFilteredReports.handle);
router.get("/:publicId", getReport.handle);
router.patch("/status/:publicId", requireAuth(tokenSigner), validateRequest(updateStatusReportSchema), updateReportStatus.handle);
router.patch("/:publicId", requireAuth(tokenSigner), upload.array("photos", 4), validateRequest(updateReportSchema), updateReport.handle);
router.post("/:publicId/follow", requireAuth(tokenSigner), followReport.handle);
router.delete("/:publicId/follow", requireAuth(tokenSigner), unfollowReport.handle);
router.get("/:publicId/follow", requireAuth(tokenSigner), isFollowingReport.handle);

export const createReportRoute = router;