import { Payment } from "@domain/payment/aggregates/PaymentAggregate";
import { PaymentRepository } from "@domain/payment/repositories/payment.repository";
import { PaymentMapper } from "./payment.mapper";
import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";

@injectable()
export class PrismaPaymentRepository implements PaymentRepository {

    constructor(
        @inject("PrismaClient")
        private readonly prisma: PrismaClient
    ) { }

    async save(payment: Payment): Promise<void> {
        await this.prisma.payment.create({
            data: PaymentMapper.toCreateInput(payment),
        });
    }

    async findByPublicId(publicId: string): Promise<Payment | null> {
        const raw = await this.prisma.payment.findUnique({
            where: { public_id: publicId },
        });

        if (!raw) return null;

        return PaymentMapper.toDomain(raw);
    }

    async update(payment: Payment): Promise<void> {
        if (!payment.idPayment) {
            throw new Error("Payment ID is required");
        }

        await this.prisma.payment.update({
            where: { payment_id: payment.idPayment },
            data: {
                mp_preference_id: payment.mpPreferenceId,
                mp_payment_id: payment.mpPaymentId,
                status: payment.status,
                updated_at: payment.updatedAt,
            },
        });
    }
}
