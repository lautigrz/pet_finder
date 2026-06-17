import { ReportOutput } from "./dto/report.output"

export interface PaginationOutputDto {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ListUserReportsOutputDto {
  data: ReportOutput[]
  pagination: PaginationOutputDto
}
