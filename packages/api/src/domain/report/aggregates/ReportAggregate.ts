import { ReportDetails } from "../types/report-details.type"
import { ReportStatus } from "../types/report.status"
import { ReportType } from "../types/report.type"
import { ReportDescription } from "../value-objects/description.vo"
import { Location } from "../value-objects/location.vo"
import { LostReportDetails } from "../value-objects/lost-report-details.vo"
import { SightingReportDetails } from "../value-objects/sighting-report-details.vo"
import { InvalidStatusTransitionError } from "../../errors/InvalidStatusTransitionError"
import { InvalidReportDetailsError } from "../../errors/InvalidReportDetailsError"
import { InvalidFieldError } from "../../errors/InvalidFieldError"


export interface CreateReportParams {
    userId: number
    userPublicId: string
    type: ReportType
    description: ReportDescription | null
    details: ReportDetails
    location: Location
    occurredAt: Date
}

interface RestoreReportParams {
    idReport: number,
    publicId: string
    userId: number
    userPublicId: string
    type: ReportType
    currentStatus: ReportStatus
    description: ReportDescription | null
    details: ReportDetails
    location: Location
    occurredAt: Date
    createdAt: Date
    updatedAt: Date | null
    featured?: boolean
    closedByModeration?: boolean
    resolved?: boolean
    resolvedAt?: Date | null
}


export class Report {

    private constructor(
        private readonly _idReport: number | null,
        private readonly _publicId: string,
        private readonly _userId: number,
        private readonly _userPublicId: string,
        private readonly type: ReportType,
        private currentStatus: ReportStatus,
        private _location: Location,
        private _description: ReportDescription | null,
        private _details: ReportDetails,
        private _occurredAt: Date,
        private readonly _createdAt: Date,
        private _updatedAt: Date | null = null,
        private _featured: boolean = false,
        private _closedByModeration: boolean = false,
        private _resolved: boolean = false,
        private _resolvedAt: Date | null = null,
    ) { }


    static create(params: CreateReportParams): Report {
        Report.validateOccurredAt(params.occurredAt);
        Report.validateDetails(params.type, params.details);

        return new Report(
            null,
            crypto.randomUUID(),
            params.userId,
            params.userPublicId,
            params.type,
            ReportStatus.ACTIVE,
            params.location,
            params.description,
            params.details,
            params.occurredAt,
            new Date(),
        )
    }


    static restore(params: RestoreReportParams): Report {
        return new Report(
            params.idReport,
            params.publicId,
            params.userId,
            params.userPublicId,
            params.type,
            params.currentStatus,
            params.location,
            params.description,
            params.details,
            params.occurredAt,
            params.createdAt,
            params.updatedAt,
            params.featured ?? false,
            params.closedByModeration ?? false,
            params.resolved ?? false,
            params.resolvedAt ?? null,
        )
    }

    changeDescription(
        description: ReportDescription,
    ): void {
        this._description = description
        this._updatedAt = new Date()
    }


    updateFields(params: {
        description?: ReportDescription | null;
        occurredAt?: Date;
        location?: Location;
        details?: ReportDetails;  
    }): void {
        if (params.description !== undefined) this._description = params.description;
        if (params.occurredAt  !== undefined) {
            Report.validateOccurredAt(params.occurredAt);
            this._occurredAt  = params.occurredAt;
        }
        if (params.location    !== undefined) this._location    = params.location;
        if (params.details     !== undefined) this._details     = params.details;  
        this._updatedAt = new Date();
    }

    private static validateOccurredAt(occurredAt: Date): void {
        if (occurredAt > new Date()) {
            throw new InvalidFieldError('occurredAt', 'cannot be in the future');
        }
    }

    private static validateResolvedAt(resolvedAt: Date, createdAt: Date): void {
        // Comparamos por día en la zona del usuario (Argentina, UTC-3) para que
        // el resultado sea igual sin importar la zona del servidor (local vs UTC en producción).
        const atDay = (date: Date) => {
            const argentina = new Date(date.getTime() - 3 * 60 * 60 * 1000);
            return Date.UTC(argentina.getUTCFullYear(), argentina.getUTCMonth(), argentina.getUTCDate());
        };
        if (atDay(resolvedAt) > atDay(new Date())) {
            throw new InvalidFieldError('resolvedAt', 'cannot be in the future');
        }
        if (atDay(resolvedAt) < atDay(createdAt)) {
            throw new InvalidFieldError('resolvedAt', 'cannot be before the report creation date');
        }
    }

    get idReport(): number | null {
        return this._idReport
    }
    get userPublicId(): string {
        return this._userPublicId
    }

    resolve(reunited: boolean, resolvedAt?: Date): void {
        const resolutionDate = resolvedAt ?? new Date()
        Report.validateResolvedAt(resolutionDate, this._createdAt)
        this.transitionTo(ReportStatus.RESOLVED)
        this._resolved = reunited
        this._resolvedAt = resolutionDate
    }

    close(): void {
        this.transitionTo(ReportStatus.CLOSED)
    }

    suspend(): void {
        this.transitionTo(ReportStatus.CLOSED)
        this._closedByModeration = true
    }

    reopen(): void {
        this.transitionTo(ReportStatus.ACTIVE)
        this._closedByModeration = false
    }

    /**
     * Exposed for the persistence (infrastructure) mapper only.
     * Must NOT be included in API responses — use `userPublicId` instead.
     */
    get userId(): number {
        return this._userId
    }

    get location(): Location {
        return this._location
    }

    get occurredAt(): Date {
        return this._occurredAt
    }

    get status(): ReportStatus {
        return this.currentStatus
    }

    get closedByModeration(): boolean {
        return this._closedByModeration
    }

    get resolved(): boolean {
        return this._resolved
    }

    get resolvedAt(): Date | null {
        return this._resolvedAt
    }

    get reportType(): ReportType {
        return this.type
    }

    get publicId(): string {
        return this._publicId
    }

    get description(): ReportDescription | null {
        return this._description
    }

    get createdAt(): Date {
        return this._createdAt
    }

    get updatedAt(): Date | null {
        return this._updatedAt
    }

    get details(): ReportDetails {
        return this._details
    }

    get featured(): boolean {
        return this._featured
    }

    isFeaturedActive(): boolean {
        return this._featured && this.currentStatus === ReportStatus.ACTIVE
    }

    private transitionTo(newStatus: ReportStatus): void {
        const allowed = Report.validTransitions[this.currentStatus]

        if (!allowed.includes(newStatus)) {
            throw new InvalidStatusTransitionError(this.currentStatus, newStatus);
        }

        this.currentStatus = newStatus
        this._updatedAt = new Date()
    }

    private static readonly validTransitions: Record<ReportStatus, ReportStatus[]> = {
        [ReportStatus.ACTIVE]: [ReportStatus.RESOLVED, ReportStatus.CLOSED],
        [ReportStatus.RESOLVED]: [ReportStatus.CLOSED],
        [ReportStatus.CLOSED]: [ReportStatus.ACTIVE]
    }


    private static validateDetails(type: ReportType, details: ReportDetails): void {
        const expectedClass = Report.detailsMap[type]

        if (!(details instanceof expectedClass)) {
            throw new InvalidReportDetailsError(type, expectedClass.name);
        }
    }

    private static readonly detailsMap = {

        [ReportType.LOST]: LostReportDetails,
        [ReportType.SIGHTING]: SightingReportDetails,
    } as const
}