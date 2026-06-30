import type { ReportRepository } from "@domain/report/repositories/report.repository";
import { ReportOutputMapper } from "./mapper/report.mapper";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { ReportStatus } from "@domain/report/types/report.status";
import { ReportOutput } from "./dto/report.output";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { inject, injectable } from "tsyringe";


export type { ReportOutput };

@injectable()
export class GetReportUseCase {
    constructor(
        @inject("ReportRepository")
        private reportRepository: ReportRepository,
        @inject("UserRepository")
        private userRepository: IUserRepository
    ) { }

    async execute(publicId: string): Promise<ReportOutput> {
        const result = await this.reportRepository.findDetailByPublicId(publicId);
        if (!result) throw new ReportNotFoundError(publicId);

        const { report, pet } = result;
        if (report.status === ReportStatus.CLOSED) throw new ReportNotFoundError(publicId);

        const user = await this.userRepository.findById(report.userId);
        if (!user) throw new Error("User not found");

        const reportImages = await this.reportRepository.findImagesByReportId(publicId);

        return ReportOutputMapper.toOutput(report, pet, user, reportImages);
    }
}