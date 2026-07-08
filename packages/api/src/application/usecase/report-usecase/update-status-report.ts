import { Report } from "@domain/report/aggregates/ReportAggregate";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import { ReportStatus } from "@domain/report/types/report.status";
import { UpdateStatusDTO } from "./dto/update-status.dto";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { NotifyReportFollowersOfStatusChangeUseCase } from "./notify-report-followers-of-status-change.usecase";
import { inject, injectable } from "tsyringe";
import type { MissionRepository } from "@domain/mission/repositories/mission.repository";
import { MissionStatus } from "@domain/mission/types/mission.status";

@injectable()
export class UpdateStatus {
  constructor(
    @inject("ReportRepository")
    private readonly reportRepository: ReportRepository,
    @inject("NotifyReportFollowersOfStatusChangeUseCase")
    private readonly notifyReportFollowersOfStatusChange: NotifyReportFollowersOfStatusChangeUseCase,
    @inject("MissionRepository")
    private readonly missionRepository: MissionRepository,
  ) { }

  async execute(dto: UpdateStatusDTO): Promise<void> {
    const report: Report | null =
      await this.reportRepository.findByPublicId(dto.publicId);

    if (!report) {
      throw new ReportNotFoundError(dto.publicId);
    }

    const previousStatus = report.status;

    if (dto.status === ReportStatus.RESOLVED) {
      report.resolve(dto.resolved ?? false);
    } else if (dto.status === ReportStatus.CLOSED) {
      report.close();
    }

    await this.reportRepository.update(report);

    const statusChanged = previousStatus !== report.status;
    const isOver = report.status === ReportStatus.RESOLVED || report.status === ReportStatus.CLOSED;

    if (statusChanged && isOver) {
      const mission = await this.missionRepository.findByReportId(report.idReport!);
      if (mission && mission.status !== MissionStatus.CLOSED) {
        mission.close();
        await this.missionRepository.update(mission);
      }
    }

    const shouldNotifyFollowers = statusChanged && isOver;

    if (shouldNotifyFollowers) {
      await this.notifyReportFollowersOfStatusChange.execute({
        reportPublicId: report.publicId,
        ownerPublicId: report.userPublicId,
        status: report.status,
      });
    }
  }
}