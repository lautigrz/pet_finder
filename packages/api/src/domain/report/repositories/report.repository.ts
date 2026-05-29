import { Report } from "../aggregates/ReportAggregate";


export interface ReportRepository {
  save(report: Report): Promise<void>

  findByPublicId(publicId: string): Promise<Report | null>
}