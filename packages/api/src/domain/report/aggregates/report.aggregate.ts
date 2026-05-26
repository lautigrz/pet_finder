import { ReportDetails } from "../types/report-details.type"
import { ReportStatus } from "../types/report.status"
import { ReportType } from "../types/report.type"
import { ReportDescription } from "../value-objects/description.vo"
import { Location } from "../value-objects/location.vo"
import { LostReportDetails } from "../value-objects/lost-report-details.vo"
import { SightingReportDetails } from "../value-objects/sighting-report-details.vo"


export interface CreateReportParams {
  userId: number
  type: ReportType
  description: ReportDescription | null
  details: ReportDetails
  location: Location
  occurredAt: Date
}


export class Report {
 
    private constructor(
    private readonly _publicId: string,
    private readonly _userId: number,
    private readonly type: ReportType,
    private currentStatus: ReportStatus,
    private readonly _location: Location,
    private _description: ReportDescription | null,
    private readonly _details: ReportDetails,
    private readonly _occurredAt: Date,
    private readonly _createdAt: Date,
    private _updatedAt: Date | null = null,
    ) {}


    static create(params: CreateReportParams): Report {
        Report.validateDetails(params.type, params.details)

        return new Report(
            crypto.randomUUID(),
            params.userId,
            params.type,
            ReportStatus.ACTIVE,
            params.location,
            params.description ?? null,
            params.details,
            params.occurredAt,
            new Date(),
        )
    }

    changeDescription(
    description: ReportDescription | null,
    ): void {
    this._description = description
    }

    get userId(): number {
    return this._userId
    }

    resolve(): void {
    this.transitionTo(ReportStatus.RESOLVED)
    }

    close(): void {
    this.transitionTo(ReportStatus.CLOSED)
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
    
    private transitionTo(newStatus: ReportStatus): void {
        const allowed = Report.validTransitions[this.currentStatus]

        if (!allowed.includes(newStatus)) {
            throw new Error(
            `Cannot transition from "${this.currentStatus}" to "${newStatus}"`
            )
        }

        this.currentStatus = newStatus
        this._updatedAt = new Date()
    }

    private static readonly validTransitions: Record<ReportStatus, ReportStatus[]> = {
        [ReportStatus.ACTIVE]: [ReportStatus.RESOLVED, ReportStatus.CLOSED],
        [ReportStatus.RESOLVED]: [ReportStatus.CLOSED],
        [ReportStatus.CLOSED]: []
    }


    private static validateDetails(type: ReportType, details: ReportDetails): void {
    const expectedClass = Report.detailsMap[type]

        if (!(details instanceof expectedClass)) {
            throw new Error(`Report of type "${type}" requires ${expectedClass.name}`)
        }
    }

    private static readonly detailsMap = {

    [ReportType.LOST]: LostReportDetails,
    [ReportType.SIGHTING]: SightingReportDetails,
    } as const
}