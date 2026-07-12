import { InvalidFieldError } from "../errors/InvalidFieldError";
import { PointValue } from "./value-objects/point-value.vo";

export class MissionUpdate {
  private constructor(
    private readonly _updateId: number | null,
    private readonly _publicId: string,
    private readonly _missionId: number,
    private readonly _userId: number,
    private readonly _comment: string,
    private readonly _photoUrl: string | null,
    private readonly _status: string,
    private readonly _createdAt: Date,
    private _point_value: PointValue | null
  ) { }

  static create(params: {
    missionId: number;
    userId: number;
    comment: string;
    photoUrl: string | null;
    pointValue?: PointValue | null;
  }): MissionUpdate {
    if (!params.comment || params.comment.trim() === "") {
      throw new InvalidFieldError("comment", "Comment must not be empty");
    }
    if (params.comment.length > 1000) {
      throw new InvalidFieldError("comment", "Comment must be less than 1000 characters");
    }
    if (params.photoUrl !== null && params.photoUrl.trim() === "") {
      throw new InvalidFieldError("photoUrl", "Photo URL must not be empty");
    }

    return new MissionUpdate(
      null,
      crypto.randomUUID(),
      params.missionId,
      params.userId,
      params.comment,
      params.photoUrl,
      "PENDING",
      new Date(),
      params.pointValue ?? null,
    );
  }

  static restore(params: {
    updateId: number;
    publicId: string;
    missionId: number;
    userId: number;
    comment: string;
    photoUrl: string | null;
    status: string;
    createdAt: Date;
    pointValue: PointValue | null;
  }): MissionUpdate {
    return new MissionUpdate(
      params.updateId,
      params.publicId,
      params.missionId,
      params.userId,
      params.comment,
      params.photoUrl,
      params.status,
      params.createdAt,
      params.pointValue
    );
  }

  get updateId(): number | null {
    return this._updateId;
  }

  get publicId(): string {
    return this._publicId;
  }

  get missionId(): number {
    return this._missionId;
  }

  get userId(): number {
    return this._userId;
  }

  get comment(): string {
    return this._comment;
  }

  get photoUrl(): string | null {
    return this._photoUrl;
  }

  get status(): string {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get pointValue(): PointValue | null {
    return this._point_value ?? null;
  }

  score(pointValue: PointValue): void {
    if (this._point_value !== null) {
      throw new Error("This comment has already been scored");
    }
    this._point_value = pointValue;
  }
}
