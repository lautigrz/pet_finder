export interface PaginationParams {
  page: number
  limit: number
}

export interface Page<T> {
  items: T[]
  total: number
}
