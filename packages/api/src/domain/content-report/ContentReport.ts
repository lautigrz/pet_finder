import { ContentReportReason, isReasonValidForTarget } from "./types/content-report-reason";
import { ContentReportStatus } from "./types/content-report-status";
import { ContentReportTargetType } from "./types/content-report-target-type";
import { InvalidReportReasonError } from "./errors/InvalidReportReasonError";

interface ContentReportProps {
    contentReportId?: number;
    publicId: string;
    reporterUserId: number;
    targetType: ContentReportTargetType;
    targetPublicId: string;
    reason: ContentReportReason;
    status: ContentReportStatus;
    description: string | null;
    suspensionReason: string | null;
    autoFlagged: boolean;
    createdAt: Date;
}

interface CreateContentReportProps {
    publicId: string;
    reporterUserId: number;
    targetType: ContentReportTargetType;
    targetPublicId: string;
    reason: ContentReportReason;
    description: string | null;
}

export class ContentReport {
    private constructor(private props: ContentReportProps) { }

    static create(props: CreateContentReportProps): ContentReport {
        if (!isReasonValidForTarget(props.reason, props.targetType)) {
            throw new InvalidReportReasonError(props.reason, props.targetType);
        }

        return new ContentReport({
            publicId: props.publicId,
            reporterUserId: props.reporterUserId,
            targetType: props.targetType,
            targetPublicId: props.targetPublicId,
            reason: props.reason,
            status: ContentReportStatus.PENDING,
            description: props.description,
            suspensionReason: null,
            autoFlagged: false,
            createdAt: new Date(),
        });
    }

    static restore(props: ContentReportProps): ContentReport {
        return new ContentReport(props);
    }

    get contentReportId() { return this.props.contentReportId; }
    get publicId() { return this.props.publicId; }
    get reporterUserId() { return this.props.reporterUserId; }
    get targetType() { return this.props.targetType; }
    get targetPublicId() { return this.props.targetPublicId; }
    get reason() { return this.props.reason; }
    get status() { return this.props.status; }
    get description() { return this.props.description; }
    get autoFlagged() { return this.props.autoFlagged; }
    get createdAt() { return this.props.createdAt; }
    get suspensionReason() { return this.props.suspensionReason; }

    approve(): void {
        this.props.status = ContentReportStatus.REVIEWED;
    }

    dismiss(): void {
        this.props.status = ContentReportStatus.DISMISSED;
    }

    suspend(reason: string): void {
        this.props.status = ContentReportStatus.SUSPENDED;
        this.props.suspensionReason = reason;
    }

    markPending(): void {
        this.props.status = ContentReportStatus.PENDING;
    }
}
