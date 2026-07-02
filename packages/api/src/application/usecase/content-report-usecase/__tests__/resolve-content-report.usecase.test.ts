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
import { ConversationRepository } from "@domain/conversation/repositories/conversation.repository";
import { Conversation } from "@domain/conversation/Conversation";

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

function fakeReport(currentStatus: ReportStatus = ReportStatus.ACTIVE): Report {
  return Report.restore({
    idReport: 1,
    publicId: "reporte-uuid",
    userId: 5,
    userPublicId: "user-pub-id",
    type: ReportType.LOST,
    currentStatus,
    description: null,
    details: LostReportDetails.create({ petId: 10 }),
    location: Location.create({ address: "Calle 1", latitude: -34.6, longitude: -58.4 }),
    occurredAt: new Date("2026-06-20"),
    createdAt: new Date("2026-06-20"),
    updatedAt: null,
  });
}

function fakeConversation(isSuspended = false): Conversation {
  return Conversation.create({
    conversationId: 1,
    publicId: "chat-uuid",
    userOneId: 5,
    userTwoId: 7,
    createdAt: new Date("2026-06-20"),
    isSuspended,
  });
}

describe("ResolveContentReportUseCase", () => {
  let contentReportRepository: ContentReportRepository;
  let reportRepository: ReportRepository;
  let conversationRepository: ConversationRepository;
  let useCase: ResolveContentReportUseCase;

  beforeEach(() => {
    contentReportRepository = {
      findByPublicId: vi.fn(),
      update: vi.fn(),
      countApprovedByTarget: vi.fn().mockResolvedValue(1),
      suspendOpenByTarget: vi.fn(),
    } as unknown as ContentReportRepository;

    reportRepository = {
      findByPublicId: vi.fn(),
      update: vi.fn(),
    } as unknown as ReportRepository;

    conversationRepository = {
      findByPublicId: vi.fn(),
      update: vi.fn(),
    } as unknown as ConversationRepository;

    useCase = new ResolveContentReportUseCase(contentReportRepository, reportRepository, conversationRepository);
  });

  it("lanza ContentReportNotFoundError si la denuncia no existe", async () => {
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(null);

    await expect(
      useCase.execute({ publicId: "x", status: ContentReportStatus.REVIEWED }),
    ).rejects.toThrow(ContentReportNotFoundError);
  });

  it("aprobar marca la denuncia como REVIEWED sin suspender el reporte", async () => {
    const denuncia = fakeContentReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(fakeReport());

    await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.REVIEWED });

    expect(denuncia.status).toBe(ContentReportStatus.REVIEWED);
    expect(contentReportRepository.update).toHaveBeenCalledWith(denuncia);
    expect(reportRepository.update).not.toHaveBeenCalled();
    expect(contentReportRepository.suspendOpenByTarget).not.toHaveBeenCalled();
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

  it("suspender manualmente cierra el reporte y suspende todas sus denuncias abiertas con el motivo", async () => {
    const denuncia = fakeContentReport();
    const reporte = fakeReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(reporte);

    await useCase.execute({
      publicId: "denuncia-uuid",
      status: ContentReportStatus.SUSPENDED,
      suspensionReason: "Contenido fraudulento",
    });

    expect(reporte.status).toBe(ReportStatus.CLOSED);
    expect(reportRepository.update).toHaveBeenCalledWith(reporte);
    expect(contentReportRepository.suspendOpenByTarget).toHaveBeenCalledWith(
      ContentReportTargetType.POST,
      "reporte-uuid",
      expect.stringContaining("Contenido fraudulento"),
    );
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

  it("aprobar por debajo del umbral no suspende la publicación", async () => {
    const denuncia = fakeContentReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(fakeReport());
    vi.mocked(contentReportRepository.countApprovedByTarget).mockResolvedValue(4);

    await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.REVIEWED });

    expect(reportRepository.update).not.toHaveBeenCalled();
    expect(contentReportRepository.suspendOpenByTarget).not.toHaveBeenCalled();
  });

  it("al alcanzar el umbral suspende la publicación (CLOSED) y suspende todas las denuncias abiertas", async () => {
    const denuncia = fakeContentReport();
    const reporte = fakeReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(contentReportRepository.countApprovedByTarget).mockResolvedValue(5);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(reporte);

    const result = await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.REVIEWED });

    expect(reporte.status).toBe(ReportStatus.CLOSED);
    expect(reportRepository.update).toHaveBeenCalledWith(reporte);
    expect(contentReportRepository.suspendOpenByTarget).toHaveBeenCalledWith(
      ContentReportTargetType.POST,
      "reporte-uuid",
      expect.stringContaining("5"),
    );
    expect(result.autoSuspended).toBe(true);
  });

  it("editar una denuncia de descartada a aprobada también cuenta para el umbral y suspende", async () => {
    const denuncia = fakeContentReport();
    denuncia.dismiss();
    const reporte = fakeReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(contentReportRepository.countApprovedByTarget).mockResolvedValue(5);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(reporte);

    const result = await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.REVIEWED });

    expect(denuncia.status).toBe(ContentReportStatus.REVIEWED);
    expect(reporte.status).toBe(ReportStatus.CLOSED);
    expect(result.autoSuspended).toBe(true);
  });

  it("editar una denuncia de aprobada a descartada no suspende la publicación", async () => {
    const denuncia = fakeContentReport();
    denuncia.approve();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);

    const result = await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.DISMISSED });

    expect(denuncia.status).toBe(ContentReportStatus.DISMISSED);
    expect(reportRepository.findByPublicId).not.toHaveBeenCalled();
    expect(contentReportRepository.suspendOpenByTarget).not.toHaveBeenCalled();
    expect(result.autoSuspended).toBe(false);
  });

  it("si la publicación ya está cerrada, no la re-cierra pero mantiene las denuncias suspendidas", async () => {
    const denuncia = fakeContentReport();
    const reporte = fakeReport(ReportStatus.CLOSED);
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(reporte);

    const result = await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.REVIEWED });

    expect(reportRepository.update).not.toHaveBeenCalled();
    expect(contentReportRepository.suspendOpenByTarget).toHaveBeenCalledWith(
      ContentReportTargetType.POST,
      "reporte-uuid",
      expect.stringContaining("5"),
    );
    expect(result.autoSuspended).toBe(false);
  });

  it("aprobar una denuncia de chat no dispara la auto-suspensión", async () => {
    const denuncia = fakeContentReport(ContentReportTargetType.CHAT);
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);

    await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.REVIEWED });

    expect(contentReportRepository.countApprovedByTarget).not.toHaveBeenCalled();
    expect(reportRepository.findByPublicId).not.toHaveBeenCalled();
  });

  it("suspender una denuncia de chat suspende la conversación y sus denuncias abiertas", async () => {
    const denuncia = fakeContentReport(ContentReportTargetType.CHAT);
    const conversation = fakeConversation();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(conversationRepository.findByPublicId).mockResolvedValue(conversation);

    await useCase.execute({
      publicId: "denuncia-uuid",
      status: ContentReportStatus.SUSPENDED,
      suspensionReason: "Comportamiento sospechoso",
    });

    expect(conversation.isSuspended).toBe(true);
    expect(conversationRepository.update).toHaveBeenCalledWith(conversation);
    expect(reportRepository.findByPublicId).not.toHaveBeenCalled();
    expect(contentReportRepository.suspendOpenByTarget).toHaveBeenCalledWith(
      ContentReportTargetType.CHAT,
      "reporte-uuid",
      expect.stringContaining("Comportamiento sospechoso"),
    );
  });
});
