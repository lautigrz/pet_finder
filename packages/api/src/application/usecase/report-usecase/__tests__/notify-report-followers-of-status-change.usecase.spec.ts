import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotifyReportFollowersOfStatusChangeUseCase } from "../notify-report-followers-of-status-change.usecase";
import { ReportFollowerRepository } from "@domain/report/repositories/report-follower.repository";
import { ReportStatus } from "@domain/report/types/report.status";
import { SendPushToUserUseCase } from "@application/usecase/send-push-to-user/send-push-to-user.usecase";

type NotificationLike = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

type SendPushInputLike = {
  userPublicId?: string;
  notification?: NotificationLike;
  pushNotification?: NotificationLike;
  push?: NotificationLike;
};

const getUserPublicIdFromInput = (input: unknown): string | undefined => {
  return (input as SendPushInputLike).userPublicId;
};

const getNotificationFromInput = (input: unknown): NotificationLike => {
  const typedInput = input as SendPushInputLike;

  const notification =
    typedInput.notification ??
    typedInput.pushNotification ??
    typedInput.push;

  if (!notification) {
    throw new Error("No se encontró la notificación dentro del input");
  }

  return notification;
};

describe("NotifyReportFollowersOfStatusChangeUseCase", () => {
  let followerRepository: ReportFollowerRepository;
  let sendPushToUserUseCase: SendPushToUserUseCase;
  let useCase: NotifyReportFollowersOfStatusChangeUseCase;

  beforeEach(() => {
    followerRepository = {
      follow: vi.fn(),
      unfollow: vi.fn(),
      isFollowing: vi.fn(),
      findFollowerPublicIdsByReportPublicId: vi.fn(),
    } as unknown as ReportFollowerRepository;

    sendPushToUserUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as SendPushToUserUseCase;

    useCase = new NotifyReportFollowersOfStatusChangeUseCase(
      followerRepository,
      sendPushToUserUseCase,
    );
  });

  it("busca los seguidores del reporte por publicId", async () => {
    vi.mocked(
      followerRepository.findFollowerPublicIdsByReportPublicId,
    ).mockResolvedValue([]);

    await useCase.execute({
      reportPublicId: "report-uuid",
      ownerPublicId: "owner-user-id",
      status: ReportStatus.RESOLVED,
    });

    expect(
      followerRepository.findFollowerPublicIdsByReportPublicId,
    ).toHaveBeenCalledWith("report-uuid");
  });

  it("envía notificación de RESOLVED a los seguidores del reporte, excluyendo al dueño", async () => {
    vi.mocked(
      followerRepository.findFollowerPublicIdsByReportPublicId,
    ).mockResolvedValue(["follower-1", "owner-user-id", "follower-2"]);

    await useCase.execute({
      reportPublicId: "report-uuid",
      ownerPublicId: "owner-user-id",
      status: ReportStatus.RESOLVED,
    });

    expect(sendPushToUserUseCase.execute).toHaveBeenCalledTimes(2);

    const firstInput = vi.mocked(sendPushToUserUseCase.execute).mock.calls[0]![0];
    const secondInput = vi.mocked(sendPushToUserUseCase.execute).mock.calls[1]![0];

    expect(getUserPublicIdFromInput(firstInput)).toBe("follower-1");
    expect(getUserPublicIdFromInput(secondInput)).toBe("follower-2");

    const firstNotification = getNotificationFromInput(firstInput);

    expect(firstNotification).toMatchObject({
      title: "¡Caso resuelto! 🐾",
      body: "Un reporte que seguías fue marcado como resuelto.",
      data: {
        reportId: "report-uuid",
        type: "REPORT_RESOLVED",
      },
    });
  });

  it("envía notificación de CLOSED a los seguidores del reporte, excluyendo al dueño", async () => {
    vi.mocked(
      followerRepository.findFollowerPublicIdsByReportPublicId,
    ).mockResolvedValue(["follower-1", "owner-user-id"]);

    await useCase.execute({
      reportPublicId: "report-uuid",
      ownerPublicId: "owner-user-id",
      status: ReportStatus.CLOSED,
    });

    expect(sendPushToUserUseCase.execute).toHaveBeenCalledTimes(1);

    const input = vi.mocked(sendPushToUserUseCase.execute).mock.calls[0]![0];

    expect(getUserPublicIdFromInput(input)).toBe("follower-1");

    const notification = getNotificationFromInput(input);

    expect(notification).toMatchObject({
      title: "Reporte cerrado",
      body: "Un reporte que seguías fue cerrado.",
      data: {
        reportId: "report-uuid",
        type: "REPORT_CLOSED",
      },
    });
  });

  it("no envía notificaciones si el reporte no tiene seguidores", async () => {
    vi.mocked(
      followerRepository.findFollowerPublicIdsByReportPublicId,
    ).mockResolvedValue([]);

    await useCase.execute({
      reportPublicId: "report-uuid",
      ownerPublicId: "owner-user-id",
      status: ReportStatus.RESOLVED,
    });

    expect(sendPushToUserUseCase.execute).not.toHaveBeenCalled();
  });

  it("no envía notificación si el único seguidor es el dueño del reporte", async () => {
    vi.mocked(
      followerRepository.findFollowerPublicIdsByReportPublicId,
    ).mockResolvedValue(["owner-user-id"]);

    await useCase.execute({
      reportPublicId: "report-uuid",
      ownerPublicId: "owner-user-id",
      status: ReportStatus.RESOLVED,
    });

    expect(sendPushToUserUseCase.execute).not.toHaveBeenCalled();
  });

  it("no falla si una notificación push individual falla", async () => {
    vi.mocked(
      followerRepository.findFollowerPublicIdsByReportPublicId,
    ).mockResolvedValue(["follower-1", "follower-2"]);

    vi.mocked(sendPushToUserUseCase.execute)
      .mockRejectedValueOnce(new Error("Push failed"))
      .mockResolvedValueOnce(undefined);

    await expect(
      useCase.execute({
        reportPublicId: "report-uuid",
        ownerPublicId: "owner-user-id",
        status: ReportStatus.RESOLVED,
      }),
    ).resolves.toBeUndefined();

    expect(sendPushToUserUseCase.execute).toHaveBeenCalledTimes(2);
  });
});