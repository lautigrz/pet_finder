export interface CreateLostNearbyNotificationParams {
  userId: number;
  reportPublicId: string;
  petName: string | null;
  reportImage: string | null;
  reportAddress: string | null;
  title: string;
  body: string;
  seen?: boolean;
}

interface RestoreLostNearbyNotificationParams {
  notificationId: number;
  publicId: string;
  userId: number;
  reportPublicId: string;
  petName: string | null;
  reportImage: string | null;
  reportAddress: string | null;
  title: string;
  body: string;
  seen: boolean;
  createdAt: Date;
}

export class LostNearbyNotification {
  private constructor(
    private readonly _notificationId: number | null,
    private readonly _publicId: string,
    private readonly _userId: number,
    private readonly _reportPublicId: string,
    private readonly _petName: string | null,
    private readonly _reportImage: string | null,
    private readonly _reportAddress: string | null,
    private readonly _title: string,
    private readonly _body: string,
    private readonly _seen: boolean,
    private readonly _createdAt: Date,
  ) {}

  static create(
    params: CreateLostNearbyNotificationParams,
  ): LostNearbyNotification {
    return new LostNearbyNotification(
      null,
      crypto.randomUUID(),
      params.userId,
      params.reportPublicId,
      params.petName,
      params.reportImage,
      params.reportAddress,
      params.title,
      params.body,
      params.seen ?? false,
      new Date(),
    );
  }

  static restore(
    params: RestoreLostNearbyNotificationParams,
  ): LostNearbyNotification {
    return new LostNearbyNotification(
      params.notificationId,
      params.publicId,
      params.userId,
      params.reportPublicId,
      params.petName,
      params.reportImage,
      params.reportAddress,
      params.title,
      params.body,
      params.seen,
      params.createdAt,
    );
  }

  get notificationId(): number | null {
    return this._notificationId;
  }

  get publicId(): string {
    return this._publicId;
  }

  get userId(): number {
    return this._userId;
  }

  get reportPublicId(): string {
    return this._reportPublicId;
  }

  get petName(): string | null {
    return this._petName;
  }

  get reportImage(): string | null {
    return this._reportImage;
  }

  get reportAddress(): string | null {
    return this._reportAddress;
  }

  get title(): string {
    return this._title;
  }

  get body(): string {
    return this._body;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get seen(): boolean {
    return this._seen;
    }

}