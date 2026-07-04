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
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { User } from "@domain/entities/User";
import { NotifyOwnerOfContentSentenceUseCase } from "@application/usecase/notify-owner-of-content-sentence/notify-owner-of-content-sentence.usecase";

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

function fakeUser(isSuspended = false): User {
  return User.reconstruct(
    9,
    "perfil-uuid",
    "perfil@test.com",
    "perfil",
    "x".repeat(60),
    true,
    new Date("2026-06-20"),
    null,
    null,
    null,
    isSuspended,
  );
}

describe("ResolveContentReportUseCase", () => {
  let contentReportRepository: ContentReportRepository;
  let reportRepository: ReportRepository;
  let conversationRepository: ConversationRepository;
  let userRepository: IUserRepository;
  let notifyOwnerOfContentSentence: { execute: ReturnType<typeof vi.fn> };
  let useCase: ResolveContentReportUseCase;

  beforeEach(() => {
    contentReportRepository = {
      findByPublicId: vi.fn(),
      update: vi.fn(),
      suspendOpenByTarget: vi.fn().mockResolvedValue(0),
      approveOpenByTarget: vi.fn().mockResolvedValue(0),
      suspendOpenForUser: vi.fn().mockResolvedValue(0),
      countDistinctApprovedPublications: vi.fn().mockResolvedValue(0),
    } as unknown as ContentReportRepository;

    reportRepository = {
      findByPublicId: vi.fn(),
      update: vi.fn(),
      closeAllByUserId: vi.fn(),
      findPublicIdsByUserId: vi.fn().mockResolvedValue([]),
    } as unknown as ReportRepository;

    conversationRepository = {
      findByPublicId: vi.fn(),
      update: vi.fn(),
    } as unknown as ConversationRepository;

    userRepository = {
      findByPublicId: vi.fn(),
      findById: vi.fn(),
      markSuspended: vi.fn(), unsuspend: vi.fn(),
    } as unknown as IUserRepository;

    notifyOwnerOfContentSentence = { execute: vi.fn().mockResolvedValue(undefined) };

    useCase = new ResolveContentReportUseCase(
      contentReportRepository,
      reportRepository,
      conversationRepository,
      userRepository,
      notifyOwnerOfContentSentence as unknown as NotifyOwnerOfContentSentenceUseCase,
    );
  });

  it("lanza ContentReportNotFoundError si la denuncia no existe", async () => {
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(null);

    await expect(
      useCase.execute({ publicId: "x", status: ContentReportStatus.REVIEWED }),
    ).rejects.toThrow(ContentReportNotFoundError);
  });

  it("aprobar una publicación reportada la oculta (reporte CLOSED) y marca la denuncia como aprobada", async () => {
    const denuncia = fakeContentReport();
    const reporte = fakeReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(reporte);

    await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.REVIEWED });

    expect(denuncia.status).toBe(ContentReportStatus.REVIEWED);
    expect(contentReportRepository.update).toHaveBeenCalledWith(denuncia);
    expect(reporte.status).toBe(ReportStatus.CLOSED);
    expect(reportRepository.update).toHaveBeenCalledWith(reporte);
    expect(contentReportRepository.approveOpenByTarget).toHaveBeenCalledWith(
      ContentReportTargetType.POST,
      "reporte-uuid",
    );
  });

  it("aprobar una publicación también aprueba las demás denuncias pendientes y devuelve cuántas", async () => {
    const denuncia = fakeContentReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(fakeReport());
    vi.mocked(contentReportRepository.approveOpenByTarget).mockResolvedValue(4);

    const result = await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.REVIEWED });

    expect(contentReportRepository.approveOpenByTarget).toHaveBeenCalledWith(
      ContentReportTargetType.POST,
      "reporte-uuid",
    );
    expect(result.approvedCount).toBe(4);
  });

  it("aprobar sin llegar a 5 publicaciones distintas no suspende al autor", async () => {
    const denuncia = fakeContentReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(fakeReport());
    vi.mocked(contentReportRepository.countDistinctApprovedPublications).mockResolvedValue(4);

    const result = await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.REVIEWED });

    expect(userRepository.markSuspended).not.toHaveBeenCalled();
    expect(contentReportRepository.suspendOpenForUser).not.toHaveBeenCalled();
    expect(result.autoSuspended).toBe(false);
  });

  it("al aprobar la 5ª publicación distinta del mismo autor lo suspende automáticamente y cascadea sus denuncias", async () => {
    const denuncia = fakeContentReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(fakeReport());
    vi.mocked(reportRepository.findPublicIdsByUserId).mockResolvedValue(["p1", "p2", "p3", "p4", "p5"]);
    vi.mocked(contentReportRepository.countDistinctApprovedPublications).mockResolvedValue(5);
    vi.mocked(userRepository.findById).mockResolvedValue(fakeUser());
    vi.mocked(contentReportRepository.suspendOpenForUser).mockResolvedValue(8);

    const result = await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.REVIEWED });

    expect(userRepository.markSuspended).toHaveBeenCalledWith(5);
    expect(reportRepository.closeAllByUserId).toHaveBeenCalledWith(5);
    expect(contentReportRepository.suspendOpenForUser).toHaveBeenCalledWith(
      "user-pub-id",
      ["p1", "p2", "p3", "p4", "p5"],
      expect.stringContaining("automática"),
    );
    expect(result.autoSuspended).toBe(true);
    expect(result.suspendedCount).toBe(8);
  });

  it("no re-suspende si el autor ya está suspendido aunque llegue al umbral", async () => {
    const denuncia = fakeContentReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(fakeReport());
    vi.mocked(contentReportRepository.countDistinctApprovedPublications).mockResolvedValue(5);
    vi.mocked(userRepository.findById).mockResolvedValue(fakeUser(true));

    const result = await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.REVIEWED });

    expect(userRepository.markSuspended).not.toHaveBeenCalled();
    expect(contentReportRepository.suspendOpenForUser).not.toHaveBeenCalled();
    expect(result.autoSuspended).toBe(false);
  });

  it("aprobar cuando la publicación ya está cerrada no la re-cierra", async () => {
    const denuncia = fakeContentReport();
    const reporte = fakeReport(ReportStatus.CLOSED);
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(reporte);

    await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.REVIEWED });

    expect(denuncia.status).toBe(ContentReportStatus.REVIEWED);
    expect(reportRepository.update).not.toHaveBeenCalled();
  });

  it("aprobar una denuncia de chat no toca ninguna publicación", async () => {
    const denuncia = fakeContentReport(ContentReportTargetType.CHAT);
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);

    await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.REVIEWED });

    expect(denuncia.status).toBe(ContentReportStatus.REVIEWED);
    expect(reportRepository.findByPublicId).not.toHaveBeenCalled();
    expect(contentReportRepository.approveOpenByTarget).not.toHaveBeenCalled();
  });

  it("eliminar marca la denuncia como DISMISSED sin tocar el reporte", async () => {
    const denuncia = fakeContentReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);

    await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.DISMISSED });

    expect(denuncia.status).toBe(ContentReportStatus.DISMISSED);
    expect(reportRepository.update).not.toHaveBeenCalled();
    expect(contentReportRepository.suspendOpenByTarget).not.toHaveBeenCalled();
  });

  it("revertir a PENDING marca la denuncia como PENDING sin tocar el reporte", async () => {
    const denuncia = fakeContentReport();
    denuncia.approve();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);

    await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.PENDING });

    expect(denuncia.status).toBe(ContentReportStatus.PENDING);
    expect(reportRepository.findByPublicId).not.toHaveBeenCalled();
  });

  it("suspender una publicación suspende al autor y cascadea TODAS sus denuncias con el motivo", async () => {
    const denuncia = fakeContentReport();
    const reporte = fakeReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(reporte);
    vi.mocked(reportRepository.findPublicIdsByUserId).mockResolvedValue(["reporte-uuid", "otra-pub-uuid"]);
    vi.mocked(contentReportRepository.suspendOpenForUser).mockResolvedValue(7);

    const result = await useCase.execute({
      publicId: "denuncia-uuid",
      status: ContentReportStatus.SUSPENDED,
      suspensionReason: "Contenido fraudulento",
    });

    expect(userRepository.markSuspended).toHaveBeenCalledWith(5);
    expect(reportRepository.closeAllByUserId).toHaveBeenCalledWith(5);
    expect(reportRepository.findPublicIdsByUserId).toHaveBeenCalledWith(5);
    expect(contentReportRepository.suspendOpenForUser).toHaveBeenCalledWith(
      "user-pub-id",
      ["reporte-uuid", "otra-pub-uuid"],
      expect.stringContaining("Contenido fraudulento"),
    );
    expect(result.suspendedCount).toBe(7);
  });

  it("suspender sin motivo lanza SuspensionReasonRequiredError", async () => {
    const denuncia = fakeContentReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);

    await expect(
      useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.SUSPENDED }),
    ).rejects.toThrow(SuspensionReasonRequiredError);
  });

  it("suspender lanza ReportedContentNotFoundError si la publicación no existe", async () => {
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

  it("suspender una denuncia de perfil suspende al usuario y TODAS sus denuncias abiertas", async () => {
    const denuncia = fakeContentReport(ContentReportTargetType.USER);
    const user = fakeUser();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(userRepository.findByPublicId).mockResolvedValue(user);
    vi.mocked(reportRepository.findPublicIdsByUserId).mockResolvedValue(["pub-uuid"]);
    vi.mocked(contentReportRepository.suspendOpenForUser).mockResolvedValue(3);

    const result = await useCase.execute({
      publicId: "denuncia-uuid",
      status: ContentReportStatus.SUSPENDED,
      suspensionReason: "Suplantación de identidad",
    });

    expect(userRepository.markSuspended).toHaveBeenCalledWith(9);
    expect(reportRepository.closeAllByUserId).toHaveBeenCalledWith(9);
    expect(reportRepository.findByPublicId).not.toHaveBeenCalled();
    expect(contentReportRepository.suspendOpenForUser).toHaveBeenCalledWith(
      "perfil-uuid",
      ["pub-uuid"],
      expect.stringContaining("Suplantación de identidad"),
    );
    expect(result.suspendedCount).toBe(3);
  });

  it("aprobar una publicación (sin auto-suspensión) le avisa al dueño que la dieron de baja", async () => {
    const denuncia = fakeContentReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(fakeReport());

    await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.REVIEWED });

    expect(notifyOwnerOfContentSentence.execute).toHaveBeenCalledWith(
      expect.objectContaining({ ownerPublicId: "user-pub-id", kind: "PUBLICATION_REMOVED" }),
    );
  });

  it("la auto-suspensión al aprobar la 5ª avisa de la cuenta suspendida y NO de la publicación", async () => {
    const denuncia = fakeContentReport();
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(fakeReport());
    vi.mocked(reportRepository.findPublicIdsByUserId).mockResolvedValue(["p1", "p2", "p3", "p4", "p5"]);
    vi.mocked(contentReportRepository.countDistinctApprovedPublications).mockResolvedValue(5);
    vi.mocked(userRepository.findById).mockResolvedValue(fakeUser());
    vi.mocked(contentReportRepository.suspendOpenForUser).mockResolvedValue(8);

    await useCase.execute({ publicId: "denuncia-uuid", status: ContentReportStatus.REVIEWED });

    expect(notifyOwnerOfContentSentence.execute).toHaveBeenCalledTimes(1);
    expect(notifyOwnerOfContentSentence.execute).toHaveBeenCalledWith(
      expect.objectContaining({ ownerPublicId: "user-pub-id", kind: "ACCOUNT_SUSPENDED" }),
    );
  });

  it("suspender un perfil le avisa al dueño de la cuenta suspendida con el motivo del admin", async () => {
    const denuncia = fakeContentReport(ContentReportTargetType.USER);
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(userRepository.findByPublicId).mockResolvedValue(fakeUser());
    vi.mocked(reportRepository.findPublicIdsByUserId).mockResolvedValue(["pub-uuid"]);
    vi.mocked(contentReportRepository.suspendOpenForUser).mockResolvedValue(3);

    await useCase.execute({
      publicId: "denuncia-uuid",
      status: ContentReportStatus.SUSPENDED,
      suspensionReason: "Suplantación de identidad",
    });

    expect(notifyOwnerOfContentSentence.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerPublicId: "perfil-uuid",
        kind: "ACCOUNT_SUSPENDED",
        motive: "Suplantación de identidad",
      }),
    );
  });

  it("suspender un chat no le manda mail a nadie", async () => {
    const denuncia = fakeContentReport(ContentReportTargetType.CHAT);
    vi.mocked(contentReportRepository.findByPublicId).mockResolvedValue(denuncia);
    vi.mocked(conversationRepository.findByPublicId).mockResolvedValue(fakeConversation());

    await useCase.execute({
      publicId: "denuncia-uuid",
      status: ContentReportStatus.SUSPENDED,
      suspensionReason: "Comportamiento sospechoso",
    });

    expect(notifyOwnerOfContentSentence.execute).not.toHaveBeenCalled();
  });
});
