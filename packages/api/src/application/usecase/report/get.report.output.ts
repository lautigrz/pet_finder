
export interface ReportOutputDto {
  publicId: string
  user: {
    publicId: string
  }
  type: string
  status: string
  description: string
  location: {
    address: string
    latitude: number
    longitude: number
  }
  details: SightingReportOutputDto | LostReportOutputDto
  occurredAt: Date
  createdAt: Date
}

export interface SightingReportOutputDto {

  animalType: string
  hasIdCollar: boolean
  color: string
  images: { photoUrl: string }[];
}

export interface LostReportOutputDto {

  publicId: string
  name: string
  animalType: string
  genderType: string
  sizeType: string
  color: string
  hasIdCollar: boolean
  breed: string

}

