import { Payment } from "../aggregates/PaymentAggregate";

export interface PaymentRepository {

  save(payment: Payment): Promise<void>;

  findByPublicId(publicId: string): Promise<Payment | null>;

  update(payment: Payment): Promise<void>;
}
