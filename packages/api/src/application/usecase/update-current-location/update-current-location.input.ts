export class UpdateCurrentLocationInput {
  constructor(
    public readonly publicId: string,
    public readonly latitude: number,
    public readonly longitude: number,
  ) {}
}