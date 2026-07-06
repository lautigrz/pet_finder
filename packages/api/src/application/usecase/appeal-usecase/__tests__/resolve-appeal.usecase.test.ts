import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResolveAppealUseCase } from "../resolve-appeal.usecase";
import { ResolveAppealInput } from "../resolve-appeal.input";
import type { AppealRepository } from "@domain/appeal/repositories/appeal.repository";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { ContentReportRepository } from "@domain/content-report/repositories/content-report.repository";
import { ContentReportTargetType } from "@domain/content-report/types/content-report-target-type";
import { NotifyAppealResultUseCase } from "../../notify-appeal-result/notify-appeal-result.usecase";
import { Appeal } from "@domain/appeal/Appeal";
import { AppealStatus } from "@domain/appeal/types/appeal-status";
import { AppealTargetType } from "@domain/appeal/types/appeal-target-type";
import { AppealNotFoundError } from "@domain/appeal/errors/AppealNotFoundError";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { ReportStatus } from "@domain/report/types/report.status";
import { Location } from "@domain/report/value-objects/location.vo";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { User } from "@domain/entities/User";

function fakeAppeal(targetType: AppealTargetType, targetPublicId: string): Appeal {
  return Appeal.restore({
    appealId: 1, publicId: "a-uuid", appellantUserId: 9, targetType, targetPublicId,
    message: "defensa", status: AppealStatus.PENDING, createdAt: new Date("2026-06-20"), resolvedAt: null,
  });
}

function closedReport(): Report {
  return Report.restore({
    idReport: 1, publicId: "post-uuid", userId: 9, userPublicId: "owner-uuid",
    type: ReportType.LOST, currentStatus: ReportStatus.CLOSED, description: null,
    details: LostReportDetails.create({ petId: 10 }),
    location: Location.create({ address: "Calle 1", latitude: -34.6, longitude: -58.4 }),
    occurredAt: new Date("2026-06-20"), createdAt: new Date("2026-06-20"), updatedAt: null,
    closedByModeration: true,
  });
}

function suspendedUser(): User {
  return User.reconstruct(9, "user-uuid", "user@test.com", "user", "x".repeat(60), true, new Date("2026-06-20"), null, null, null, true);
}

describe("ResolveAppealUseCase", () => {
  let appealRepository: AppealRepository;
  let reportRepository: ReportRepository;
  let userRepository: IUserRepository;
  let contentReportRepository: ContentReportRepository;
  let notifyAppealResult: { execute: ReturnType<typeof vi.fn> };
  let useCase: ResolveAppealUseCase;

  beforeEach(() => {
    appealRepository = { findByPublicId: vi.fn(), update: vi.fn(), save: vi.fn(), existsForTarget: vi.fn(), findQueueByStatus: vi.fn() } as unknown as AppealRepository;
    reportRepository = { findByPublicId: vi.fn(), update: vi.fn(), reopenModerationClosedByUserId: vi.fn(), findPublicIdsByUserId: vi.fn().mockResolvedValue([]) } as unknown as ReportRepository;
    userRepository = { findByPublicId: vi.fn(), unsuspend: vi.fn() } as unknown as IUserRepository;
    contentReportRepository = { dismissByTarget: vi.fn(), dismissResolvedForUser: vi.fn() } as unknown as ContentReportRepository;
    notifyAppealResult = { execute: vi.fn().mockResolvedValue(undefined) };
    useCase = new ResolveAppealUseCase(
      appealRepository, reportRepository, userRepository, contentReportRepository,
      notifyAppealResult as unknown as NotifyAppealResultUseCase,
    );
  });

  it("lanza AppealNotFoundError si la apelación no existe", async () => {
    vi.mocked(appealRepository.findByPublicId).mockResolvedValue(null);

    await expect(useCase.execute(new ResolveAppealInput("x", true))).rejects.toThrow(AppealNotFoundError);
  });

  it("aceptar una apelación de POST reabre la publicación y avisa aceptada", async () => {
    const appeal = fakeAppeal(AppealTargetType.POST, "post-uuid");
    const report = closedReport();
    vi.mocked(appealRepository.findByPublicId).mockResolvedValue(appeal);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report);

    await useCase.execute(new ResolveAppealInput("a-uuid", true));

    expect(appeal.status).toBe(AppealStatus.ACCEPTED);
    expect(appealRepository.update).toHaveBeenCalledWith(appeal);
    expect(report.status).toBe(ReportStatus.ACTIVE);
    expect(reportRepository.update).toHaveBeenCalledWith(report);
    expect(notifyAppealResult.execute).toHaveBeenCalledWith(
      expect.objectContaining({ appellantUserId: 9, accepted: true, targetType: AppealTargetType.POST }),
    );
    expect(contentReportRepository.dismissByTarget).toHaveBeenCalledWith(ContentReportTargetType.POST, "post-uuid");
  });

  it("aceptar una apelación de CUENTA desbanea al usuario y reabre sus posts de moderación", async () => {
    const appeal = fakeAppeal(AppealTargetType.ACCOUNT, "user-uuid");
    vi.mocked(appealRepository.findByPublicId).mockResolvedValue(appeal);
    vi.mocked(userRepository.findByPublicId).mockResolvedValue(suspendedUser());

    await useCase.execute(new ResolveAppealInput("a-uuid", true));

    expect(userRepository.unsuspend).toHaveBeenCalledWith(9);
    expect(reportRepository.reopenModerationClosedByUserId).toHaveBeenCalledWith(9);
    expect(notifyAppealResult.execute).toHaveBeenCalledWith(
      expect.objectContaining({ accepted: true, targetType: AppealTargetType.ACCOUNT }),
    );
    expect(contentReportRepository.dismissResolvedForUser).toHaveBeenCalledWith("user-uuid", expect.any(Array));
  });

  it("rechazar no revierte nada y avisa rechazada", async () => {
    const appeal = fakeAppeal(AppealTargetType.POST, "post-uuid");
    vi.mocked(appealRepository.findByPublicId).mockResolvedValue(appeal);

    await useCase.execute(new ResolveAppealInput("a-uuid", false));

    expect(appeal.status).toBe(AppealStatus.REJECTED);
    expect(reportRepository.findByPublicId).not.toHaveBeenCalled();
    expect(notifyAppealResult.execute).toHaveBeenCalledWith(
      expect.objectContaining({ accepted: false, targetType: AppealTargetType.POST }),
    );
  });
});
