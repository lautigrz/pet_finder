export interface RawReportEmb {
  report_id: number;
  embedding_description: string | null;
}

export interface RawImageEmb {
  image_id: number;
  embedding_photo: string | null;
}

export interface RawReportImageEmb extends RawImageEmb {
  report_id: number;
}

export interface RawPetImageEmb extends RawImageEmb {
  pet_id: number;
}
