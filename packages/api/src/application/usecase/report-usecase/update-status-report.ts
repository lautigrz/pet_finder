import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { ReportStatus } from "@domain/report/types/report.status";
import { UpdateStatusDTO } from "./dto/update-status.dto";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { NotifyReportFollowersOfStatusChangeUseCase } from "./notify-report-followers-of-status-change.usecase";

export class UpdateStatus {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly notifyReportFollowersOfStatusChange: NotifyReportFollowersOfStatusChangeUseCase,
  ) {}

  async execute(dto: UpdateStatusDTO): Promise<void> {
    const report: Report | null =
      await this.reportRepository.findByPublicId(dto.publicId);

    if (!report) {
      throw new ReportNotFoundError(dto.publicId);
    }

    const previousStatus = report.status;

    if (dto.status === ReportStatus.RESOLVED) {
      report.resolve();
    } else if (dto.status === ReportStatus.CLOSED) {
      report.close();
    }

    await this.reportRepository.update(report);

    const statusChanged = previousStatus !== report.status;

    const shouldNotifyFollowers =
      statusChanged &&
      (
        report.status === ReportStatus.RESOLVED ||
        report.status === ReportStatus.CLOSED
      );

    if (shouldNotifyFollowers) {
      await this.notifyReportFollowersOfStatusChange.execute({
        reportPublicId: report.publicId,
        ownerPublicId: report.userPublicId,
        status: report.status,
      });
    }
  }
}