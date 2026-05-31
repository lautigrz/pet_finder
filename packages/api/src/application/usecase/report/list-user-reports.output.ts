import { ReportOutputDto } from "./get.report.output"

export interface PaginationOutputDto {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ListUserReportsOutputDto {
  data: ReportOutputDto[]
  pagination: PaginationOutputDto
}
