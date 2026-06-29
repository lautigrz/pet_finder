import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateStatus } from "../update-status-report";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { ReportStatus } from "@domain/report/types/report.status";
import { Location } from "@domain/report/value-objects/location.vo";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { InvalidStatusTransitionError } from "@domain/errors/InvalidStatusTransitionError";
import { NotifyReportFollowersOfStatusChangeUseCase } from "../notify-report-followers-of-status-change.usecase";

const validLocation = Location.create({
  address: "Av. Corrientes 1234",
  latitude: -34.603722,
  longitude: -58.381592,
});

const createFakeActiveReport = () => {
  return Report.restore({
    idReport: 1,
    publicId: "report-uuid",
    userId: 5,
    userPublicId: "user-pub-id",
    type: ReportType.LOST,
    currentStatus: ReportStatus.ACTIVE,
    description: null,
    details: LostReportDetails.create({ petId: 10 }),
    location: validLocation,
    occurredAt: new Date("2024-05-01"),
    createdAt: new Date("2024-05-01"),
    updatedAt: null,
  });
};

const createFakeClosedReport = () => {
  return Report.restore({
    idReport: 1,
    publicId: "report-uuid",
    userId: 5,
    userPublicId: "user-pub-id",
    type: ReportType.LOST,
    currentStatus: ReportStatus.CLOSED,
    description: null,
    details: LostReportDetails.create({ petId: 10 }),
    location: validLocation,
    occurredAt: new Date("2024-05-01"),
    createdAt: new Date("2024-05-01"),
    updatedAt: null,
  });
};

describe("UpdateStatus UseCase", () => {
  let reportRepository: ReportRepository;
  let notifyReportFollowersOfStatusChange: NotifyReportFollowersOfStatusChangeUseCase;
  let useCase: UpdateStatus;

  beforeEach(() => {
    reportRepository = {
      save: vi.fn(),
      findByPublicId: vi.fn(),
      findDetailByPublicId: vi.fn(),
      findByUserPublicId: vi.fn(),
      findIdsByQuery: vi.fn(),
      findByIds: vi.fn(),
      findDetailsByIds: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      findImagesByReportId: vi.fn(),
      updateFields: vi.fn(),
    } as unknown as ReportRepository;

    notifyReportFollowersOfStatusChange = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as NotifyReportFollowersOfStatusChangeUseCase;

    useCase = new UpdateStatus(
      reportRepository,
      notifyReportFollowersOfStatusChange,
    );
  });

  it("debería lanzar un error si el reporte no existe", async () => {
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(null);

    await expect(
      useCase.execute({
        publicId: "report-uuid",
        status: ReportStatus.RESOLVED,
      }),
    ).rejects.toThrow("Report not found");

    expect(reportRepository.update).not.toHaveBeenCalled();
    expect(notifyReportFollowersOfStatusChange.execute).not.toHaveBeenCalled();
  });

  it("debería actualizar el estado a RESOLVED correctamente y guardarlo en el repositorio", async () => {
    const report = createFakeActiveReport();
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report);

    await useCase.execute({
      publicId: "report-uuid",
      status: ReportStatus.RESOLVED,
    });

    expect(report.status).toBe(ReportStatus.RESOLVED);
    expect(reportRepository.update).toHaveBeenCalledWith(report);
  });

  it("debería notificar a los seguidores cuando el reporte pasa a RESOLVED", async () => {
    const report = createFakeActiveReport();
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report);

    await useCase.execute({
      publicId: "report-uuid",
      status: ReportStatus.RESOLVED,
    });

    expect(notifyReportFollowersOfStatusChange.execute).toHaveBeenCalledWith({
      reportPublicId: "report-uuid",
      ownerPublicId: "user-pub-id",
      status: ReportStatus.RESOLVED,
    });
  });

  it("debería actualizar el estado a CLOSED correctamente y guardarlo en el repositorio", async () => {
    const report = createFakeActiveReport();
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report);

    await useCase.execute({
      publicId: "report-uuid",
      status: ReportStatus.CLOSED,
    });

    expect(report.status).toBe(ReportStatus.CLOSED);
    expect(reportRepository.update).toHaveBeenCalledWith(report);
  });

  it("debería notificar a los seguidores cuando el reporte pasa a CLOSED", async () => {
    const report = createFakeActiveReport();
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report);

    await useCase.execute({
      publicId: "report-uuid",
      status: ReportStatus.CLOSED,
    });

    expect(notifyReportFollowersOfStatusChange.execute).toHaveBeenCalledWith({
      reportPublicId: "report-uuid",
      ownerPublicId: "user-pub-id",
      status: ReportStatus.CLOSED,
    });
  });

  it("debería propagar errores de transición de estado inválidos", async () => {
    const report = createFakeClosedReport();
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report);

    await expect(
      useCase.execute({
        publicId: "report-uuid",
        status: ReportStatus.RESOLVED,
      }),
    ).rejects.toThrow(InvalidStatusTransitionError);

    expect(reportRepository.update).not.toHaveBeenCalled();
    expect(notifyReportFollowersOfStatusChange.execute).not.toHaveBeenCalled();
  });

  it("no debería notificar si falla el update del repositorio", async () => {
    const report = createFakeActiveReport();
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(report);
    vi.mocked(reportRepository.update).mockRejectedValue(new Error("DB error"));

    await expect(
      useCase.execute({
        publicId: "report-uuid",
        status: ReportStatus.RESOLVED,
      }),
    ).rejects.toThrow("DB error");

    expect(notifyReportFollowersOfStatusChange.execute).not.toHaveBeenCalled();
  });
});