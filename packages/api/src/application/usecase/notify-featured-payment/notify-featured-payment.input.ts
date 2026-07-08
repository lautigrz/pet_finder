export interface NotifyFeaturedPaymentInput {
    userId: number;
    reportId: number;
    amount: number;
    currency: string;
    operationId: string;
}
