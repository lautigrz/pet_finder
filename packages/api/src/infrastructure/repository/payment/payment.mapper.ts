import { Payment } from "@domain/payment/aggregates/PaymentAggregate";
import { PaymentStatus } from "@domain/payment/types/payment.status";
import { Prisma } from "@prisma/client";

type PrismaPayment = Prisma.PaymentGetPayload<object>;

export class PaymentMapper {

  static toDomain(raw: PrismaPayment): Payment {
    return Payment.restore({
      idPayment: raw.payment_id,
      publicId: raw.public_id,
      reportId: raw.report_id,
      userId: raw.user_id,
      mpPreferenceId: raw.mp_preference_id,
      mpPaymentId: raw.mp_payment_id,
      status: raw.status as PaymentStatus,
      amount: raw.amount.toNumber(),
      currency: raw.currency,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  static toCreateInput(payment: Payment): Prisma.PaymentCreateInput {
    return {
      public_id: payment.publicId,
      report: { connect: { report_id: payment.reportId } },
      user: { connect: { user_id: payment.userId } },
      mp_preference_id: payment.mpPreferenceId,
      mp_payment_id: payment.mpPaymentId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      created_at: payment.createdAt,
    };
  }
}
