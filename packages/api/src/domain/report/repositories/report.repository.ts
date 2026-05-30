import { Report } from "../aggregates/ReportAggregate";
import { Page, PaginationParams } from "../../shared/pagination/pagination";


export interface ReportRepository {
  save(report: Report): Promise<void>

  findByPublicId(publicId: string): Promise<Report | null>

  findByUserPublicId(userPublicId: string, pagination: PaginationParams): Promise<Page<Report>>
}