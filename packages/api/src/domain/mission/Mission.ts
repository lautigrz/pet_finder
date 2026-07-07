import { MissionStatus } from "./types/mission.status";
import { SearchArea } from "./value-objects/search-area.vo";
import { MissionClosedError } from "../errors/MissionClosedError";
import { UnauthorizedMissionEditError } from "../errors/UnauthorizedMissionEditError";

export class Mission {
  private constructor(
    private readonly _missionId: number | null,
    private readonly _publicId: string,
    private readonly _reportId: number,
    private _searchArea: SearchArea,
    private _title: string,
    private _description: string,
    private _status: MissionStatus,
    private _volunteerIds: number[],
    private readonly _createdAt: Date,
    private _updatedAt: Date | null
  ) {}

  static create(params: {
    reportId: number;
    searchArea: SearchArea;
    title: string;
    description: string;
  }): Mission {
    return new Mission(
      null,
      crypto.randomUUID(),
      params.reportId,
      params.searchArea,
      params.title,
      params.description,
      MissionStatus.OPEN,
      [],
      new Date(),
      null
    );
  }

  static restore(params: {
    missionId: number;
    publicId: string;
    reportId: number;
    searchArea: SearchArea;
    title: string;
    description: string;
    status: MissionStatus;
    volunteerIds: number[];
    createdAt: Date;
    updatedAt: Date | null;
  }): Mission {
    return new Mission(
      params.missionId,
      params.publicId,
      params.reportId,
      params.searchArea,
      params.title,
      params.description,
      params.status,
      params.volunteerIds,
      params.createdAt,
      params.updatedAt
    );
  }

  // Getters
  get missionId(): number | null {
    return this._missionId;
  }

  get publicId(): string {
    return this._publicId;
  }

  get reportId(): number {
    return this._reportId;
  }

  get searchArea(): SearchArea {
    return this._searchArea;
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get status(): MissionStatus {
    return this._status;
  }

  get volunteerIds(): number[] {
    return [...this._volunteerIds];
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date | null {
    return this._updatedAt;
  }

  // Domain behaviors
  joinVolunteer(userId: number): void {
    if (this._status === MissionStatus.CLOSED) {
      throw new MissionClosedError("join");
    }
    if (!this._volunteerIds.includes(userId)) {
      this._volunteerIds.push(userId);
      this._updatedAt = new Date();
    }
    this.updateStatus();
  }

  leaveVolunteer(userId: number): void {
    if (this._status === MissionStatus.CLOSED) {
      throw new MissionClosedError("leave");
    }
    const index = this._volunteerIds.indexOf(userId);
    if (index !== -1) {
      this._volunteerIds.splice(index, 1);
      this._updatedAt = new Date();
    }
    this.updateStatus();
  }

  cancel(reportOwnerId: number, executorId: number): void {
    if (reportOwnerId !== executorId) {
      throw new UnauthorizedMissionEditError();
    }
    if (this._status === MissionStatus.CLOSED) {
      throw new MissionClosedError("cancel");
    }
    this._status = MissionStatus.CLOSED;
    this._updatedAt = new Date();
  }

  close(): void {
    if (this._status === MissionStatus.CLOSED) {
      return; // Already closed, idempotent
    }
    this._status = MissionStatus.CLOSED;
    this._updatedAt = new Date();
  }

  updateDetails(params: {
    searchArea?: SearchArea;
    title?: string;
    description?: string;
    reportOwnerId: number;
    executorId: number;
  }): void {
    if (params.reportOwnerId !== params.executorId) {
      throw new UnauthorizedMissionEditError();
    }
    if (this._status === MissionStatus.CLOSED) {
      throw new MissionClosedError("update details of");
    }

    let updated = false;
    if (params.searchArea !== undefined) {
      this._searchArea = params.searchArea;
      updated = true;
    }
    if (params.title !== undefined) {
      this._title = params.title;
      updated = true;
    }
    if (params.description !== undefined) {
      this._description = params.description;
      updated = true;
    }
    if (updated) {
      this._updatedAt = new Date();
    }
  }

  hasExpired(): boolean {
    if (this._status === MissionStatus.CLOSED) return false;
    const lastActiveDate = this._updatedAt || this._createdAt;
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    return new Date().getTime() - lastActiveDate.getTime() > sevenDaysInMs;
  }

  checkExpiration(): void {
    if (this.hasExpired()) {
      this.close();
    }
  }

  private updateStatus(): void {
    if (this._status === MissionStatus.CLOSED) return;
    this._status = this._volunteerIds.length > 0 ? MissionStatus.IN_PROGRESS : MissionStatus.OPEN;
  }
}