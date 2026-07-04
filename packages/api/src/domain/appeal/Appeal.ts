import { AppealStatus } from "./types/appeal-status";
import { AppealTargetType } from "./types/appeal-target-type";
import { AppealMessageRequiredError } from "./errors/AppealMessageRequiredError";
import { AppealAlreadyResolvedError } from "./errors/AppealAlreadyResolvedError";

interface AppealProps {
    appealId?: number;
    publicId: string;
    appellantUserId: number;
    targetType: AppealTargetType;
    targetPublicId: string;
    message: string;
    status: AppealStatus;
    createdAt: Date;
    resolvedAt: Date | null;
}

interface CreateAppealProps {
    publicId: string;
    appellantUserId: number;
    targetType: AppealTargetType;
    targetPublicId: string;
    message: string;
}

export class Appeal {
    private constructor(private props: AppealProps) { }

    static create(props: CreateAppealProps): Appeal {
        const message = props.message.trim();
        if (!message) throw new AppealMessageRequiredError();

        return new Appeal({
            publicId: props.publicId,
            appellantUserId: props.appellantUserId,
            targetType: props.targetType,
            targetPublicId: props.targetPublicId,
            message,
            status: AppealStatus.PENDING,
            createdAt: new Date(),
            resolvedAt: null,
        });
    }

    static restore(props: AppealProps): Appeal {
        return new Appeal(props);
    }

    get appealId(): number | undefined { return this.props.appealId; }
    get publicId(): string { return this.props.publicId; }
    get appellantUserId(): number { return this.props.appellantUserId; }
    get targetType(): AppealTargetType { return this.props.targetType; }
    get targetPublicId(): string { return this.props.targetPublicId; }
    get message(): string { return this.props.message; }
    get status(): AppealStatus { return this.props.status; }
    get createdAt(): Date { return this.props.createdAt; }
    get resolvedAt(): Date | null { return this.props.resolvedAt; }

    accept(): void {
        this.resolve(AppealStatus.ACCEPTED);
    }

    reject(): void {
        this.resolve(AppealStatus.REJECTED);
    }

    private resolve(status: AppealStatus): void {
        if (this.props.status !== AppealStatus.PENDING) throw new AppealAlreadyResolvedError();
        this.props.status = status;
        this.props.resolvedAt = new Date();
    }
}
