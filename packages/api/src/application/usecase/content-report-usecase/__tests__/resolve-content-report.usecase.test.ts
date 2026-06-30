import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResolveContentReportUseCase } from "@application/usecase/content-report-usecase/resolve-content-report.usecase";
import { ContentReportRepository } from "@domain/content-report/repositories/content-report.repository";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { ContentReport } from "@domain/content-report/ContentReport";
import { ContentReportStatus } from "@domain/content-report/types/content-report-status";
import { ContentReportTargetType } from "@domain/content-report/types/content-report-target-type";
import { ContentReportReason } from "@domain/content-report/types/content-report-reason";
import { ContentReportNotFoundError } from "@domain/content-report/errors/ContentReportNotFoundError";
import { SuspensionReasonRequiredError } from "@domain/content-report/errors/SuspensionReasonRequiredError";
import { ReportedContentNotFoundError } from "@domain/content-report/errors/ReportedContentNotFoundError";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { ReportStatus } from "@domain/report/types/report.status";
import { Location } from "@domain/report/value-objects/location.vo";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";

function fakeContentReport(targetType: ContentReportTargetType = ContentReportTargetType.POST): ContentReport {
  return ContentReport.restore({
    contentReportId: 1,
    publicId: "denuncia-uuid",
    reporterUserId: 5,
    targetType,
    targetPublicId: "reporte-uuid",
    reason: ContentReportReason.FALSE_INFORMATION,
    status: ContentReportStatus.PENDING,
    description: null,
    suspensionReason: null,
    autoFlagged: false,
    createdAt: new Date("2026-06-20"),
  });
}

function fakeReport(): Report {
  return Report.restore({
    idReport: 1,
    publicId: "reporte-uuid",
    userId: 5,
    userPublicId: "user-pub-id",
    type: ReportType.LOST,
    currentStatus: ReportStatus.ACTIVE,
    description: null,
    details: LostReportDetails.create({ petId: 10 }),
    location: Location.create({ address: "Calle 1", latitude: -34.6, longitude: -58.4 }),
    occurredAt: new Date("2026-06-20"),
    createdAt: new Date("2026-06-20"),
    updatedAt: null,
  });
}

describe("ResolveContentReportUseCase", () => {
  let contentReportRepository: ContentReportRepository;
  let reportRepository: ReportRepository;
  let useCase: ResolveContentReportUseCase;

  beforeEach(() => {
    contentReportRepository = {
      findByPublicId: vi.fn(),
      update: vi.fn(),
    } as unknown as ContentReportRepository;

    reportRepository = {
      findByPublicId: vi.fn(),
      update: vi.fn(),
    } as unknown as ReportRepository;

    useCase = new ResolveContentReportUseCase(contentReportRepository, reportRepository);
  });

  it("lanza ContentReportNotFoundError si la denuncia no existe", async () => {
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(null);

    await expect(
      useCase.execute({ publicId: "x", status: ContentReportStatus.REVIEWED }),
    ).rejects.toThrow(ContentReportNotFoundError);
  });

  it("aprobar marca la denuncia como REVIEWED sin tocar el reporte", async () => {
    const denuncia = fakeContentReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);

    await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.REVIEWED });

    expect(denuncia.status).toBe(ContentReportStatus.REVIEWED);
    expect(contentReportRepository.update).toHaveBeenCalledWith(denuncia);
    expect(reportRepository.findByPublicId).not.toHaveBeenCalled();
  });

  it("eliminar marca la denuncia como DISMISSED sin tocar el reporte", async () => {
    const denuncia = fakeContentReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);

    await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.DISMISSED });

    expect(denuncia.status).toBe(ContentReportStatus.DISMISSED);
    expect(reportRepository.update).not.toHaveBeenCalled();
  });

  it("revertir a PENDING marca la denuncia como PENDING sin tocar el reporte", async () => {
    const denuncia = fakeContentReport();
    denuncia.approve();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);

    await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.PENDING });

    expect(denuncia.status).toBe(ContentReportStatus.PENDING);
    expect(reportRepository.findByPublicId).not.toHaveBeenCalled();
  });

  it("suspender marca la denuncia SUSPENDED + motivo y suspende el reporte (CLOSED)", async () => {
    const denuncia = fakeContentReport();
    const reporte = fakeReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(reporte);

    await useCase.execute({
      publicId: "denuncia-uuid",
      status: ContentReportStatus.SUSPENDED,
      suspensionReason: "Contenido fraudulento",
    });

    expect(denuncia.status).toBe(ContentReportStatus.SUSPENDED);
    expect(denuncia.suspensionReason).toBe("Contenido fraudulento");
    expect(reporte.status).toBe(ReportStatus.CLOSED);
    expect(reportRepository.update).toHaveBeenCalledWith(reporte);
  });

  it("suspender sin motivo lanza SuspensionReasonRequiredError", async () => {
    const denuncia = fakeContentReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);

    await expect(
      useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.SUSPENDED }),
    ).rejects.toThrow(SuspensionReasonRequiredError);
  });

  it("suspender lanza ReportedContentNotFoundError si el reporte no existe", async () => {
    const denuncia = fakeContentReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(null);

    await expect(
      useCase.execute({
        publicId: "denuncia-uuid",
        status: ContentReportStatus.SUSPENDED,
        suspensionReason: "x",
      }),
    ).rejects.toThrow(ReportedContentNotFoundError);
  });
});
