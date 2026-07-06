import { PaymentStatus } from "../types/payment.status"


export interface CreatePaymentParams {
    reportId: number
    userId: number
    amount: number
    currency: string
}

interface RestorePaymentParams {
    idPayment: number
    publicId: string
    reportId: number
    userId: number
    mpPreferenceId: string | null
    mpPaymentId: string | null
    status: PaymentStatus
    amount: number
    currency: string
    createdAt: Date
    updatedAt: Date | null
}


export class Payment {

    private constructor(
        private readonly _idPayment: number | null,
        private readonly _publicId: string,
        private readonly _reportId: number,
        private readonly _userId: number,
        private _mpPreferenceId: string | null,
        private _mpPaymentId: string | null,
        private _status: PaymentStatus,
        private readonly _amount: number,
        private readonly _currency: string,
        private readonly _createdAt: Date,
        private _updatedAt: Date | null = null,
    ) { }


    static create(params: CreatePaymentParams): Payment {
        return new Payment(
            null,
            crypto.randomUUID(),
            params.reportId,
            params.userId,
            null,
            null,
            PaymentStatus.PENDING,
            params.amount,
            params.currency,
            new Date(),
        )
    }


    static restore(params: RestorePaymentParams): Payment {
        return new Payment(
            params.idPayment,
            params.publicId,
            params.reportId,
            params.userId,
            params.mpPreferenceId,
            params.mpPaymentId,
            params.status,
            params.amount,
            params.currency,
            params.createdAt,
            params.updatedAt,
        )
    }

    attachPreference(preferenceId: string): void {
        this._mpPreferenceId = preferenceId
        this._updatedAt = new Date()
    }

    approve(mpPaymentId: string): void {
        this._status = PaymentStatus.APPROVED
        this._mpPaymentId = mpPaymentId
        this._updatedAt = new Date()
    }

    reject(mpPaymentId: string): void {
        this._status = PaymentStatus.REJECTED
        this._mpPaymentId = mpPaymentId
        this._updatedAt = new Date()
    }

    get isApproved(): boolean {
        return this._status === PaymentStatus.APPROVED
    }

    get idPayment(): number | null {
        return this._idPayment
    }

    get publicId(): string {
        return this._publicId
    }

    get reportId(): number {
        return this._reportId
    }

    get userId(): number {
        return this._userId
    }

    get mpPreferenceId(): string | null {
        return this._mpPreferenceId
    }

    get mpPaymentId(): string | null {
        return this._mpPaymentId
    }

    get status(): PaymentStatus {
        return this._status
    }

    get amount(): number {
        return this._amount
    }

    get currency(): string {
        return this._currency
    }

    get createdAt(): Date {
        return this._createdAt
    }

    get updatedAt(): Date | null {
        return this._updatedAt
    }
}
