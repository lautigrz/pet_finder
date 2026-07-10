export class CreateLostNearbyNotificationInput {
  constructor(
    public readonly userId: number,
    public readonly userPublicId: string,
    public readonly reportPublicId: string,
    public readonly petName: string | null,
    public readonly reportImage: string | null,
    public readonly reportAddress: string | null,
    public readonly title: string,
    public readonly body: string,
  ) {}
}