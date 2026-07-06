import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProcessPaymentWebhookUseCase } from "../process-payment-webhook.usecase";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { PaymentRepository } from "@domain/payment/repositories/payment.repository";
import { PaymentGateway } from "@domain/payment/gateway/payment-gateway";
import { PaymentConfig } from "@application/ports/PaymentConfig";
import { Payment } from "@domain/payment/aggregates/PaymentAggregate";
import { PaymentStatus } from "@domain/payment/types/payment.status";
import { PaymentNotFoundError } from "@domain/payment/errors/PaymentNotFoundError";
import { InvalidWebhookSignatureError } from "@domain/payment/errors/InvalidWebhookSignatureError";

const config: PaymentConfig = {
  featuredPrice: 1500,
  currency: "ARS",
  frontendBaseUrl: "http://localhost:4200",
  notificationUrl: "http://localhost:3000/api/payments/webhook",
  validateWebhookSignature: true,
};

function pendingPayment(): Payment {
  return Payment.restore({
    idPayment: 1,
    publicId: "payment-uuid",
    reportId: 7,
    userId: 5,
    mpPreferenceId: "pref-123",
    mpPaymentId: null,
    status: PaymentStatus.PENDING,
    amount: 1500,
    currency: "ARS",
    createdAt: new Date("2024-05-01"),
    updatedAt: null,
  });
}

function approvedPayment(): Payment {
  return Payment.restore({
    idPayment: 1,
    publicId: "payment-uuid",
    reportId: 7,
    userId: 5,
    mpPreferenceId: "pref-123",
    mpPaymentId: "mp-999",
    status: PaymentStatus.APPROVED,
    amount: 1500,
    currency: "ARS",
    createdAt: new Date("2024-05-01"),
    updatedAt: null,
  });
}

const validInput = {
  type: "payment",
  dataId: "mp-999",
  xSignature: "ts=1,v1=abc",
  xRequestId: "req-1",
};

describe("ProcessPaymentWebhookUseCase", () => {
  let reportRepository: ReportRepository;
  let paymentRepository: PaymentRepository;
  let paymentGateway: PaymentGateway;
  let useCase: ProcessPaymentWebhookUseCase;

  beforeEach(() => {
    reportRepository = {
      findByPublicId: vi.fn(),
      markFeatured: vi.fn(),
    } as unknown as ReportRepository;

    paymentRepository = {
      save: vi.fn(),
      findByPublicId: vi.fn(),
      update: vi.fn(),
    } as unknown as PaymentRepository;

    paymentGateway = {
      createPreference: vi.fn(),
      getPayment: vi.fn(),
      verifySignature: vi.fn().mockReturnValue(true),
    } as unknown as PaymentGateway;

    useCase = new ProcessPaymentWebhookUseCase(paymentRepository, reportRepository, paymentGateway, config);
  });

  it("aprueba el pago y destaca el reporte cuando el pago esta approved", async () => {
    vi.mocked(paymentGateway.getPayment).mockResolvedValue({
      mpPaymentId: "mp-999",
      status: "approved",
      externalReference: "payment-uuid",
      approvedAt: new Date("2024-05-10T00:00:00.000Z"),
    });
    vi.mocked(paymentRepository.findByPublicId).mockResolvedValue(pendingPayment());

    await useCase.execute(validInput);

    expect(paymentRepository.update).toHaveBeenCalledOnce();
    expect(reportRepository.markFeatured).toHaveBeenCalledOnce();
    expect(reportRepository.markFeatured).toHaveBeenCalledWith(7);
  });

  it("es idempotente: si el pago ya esta aprobado no vuelve a destacar", async () => {
    vi.mocked(paymentGateway.getPayment).mockResolvedValue({
      mpPaymentId: "mp-999",
      status: "approved",
      externalReference: "payment-uuid",
      approvedAt: new Date("2024-05-10T00:00:00.000Z"),
    });
    vi.mocked(paymentRepository.findByPublicId).mockResolvedValue(approvedPayment());

    await useCase.execute(validInput);

    expect(paymentRepository.update).not.toHaveBeenCalled();
    expect(reportRepository.markFeatured).not.toHaveBeenCalled();
  });

  it("lanza InvalidWebhookSignatureError si la firma es invalida", async () => {
    vi.mocked(paymentGateway.verifySignature).mockReturnValue(false);

    await expect(useCase.execute(validInput)).rejects.toThrow(InvalidWebhookSignatureError);
    expect(paymentGateway.getPayment).not.toHaveBeenCalled();
  });

  it("con la validacion de firma desactivada, procesa el pago aunque la firma sea invalida", async () => {
    vi.mocked(paymentGateway.verifySignature).mockReturnValue(false);
    vi.mocked(paymentGateway.getPayment).mockResolvedValue({
      mpPaymentId: "mp-999",
      status: "approved",
      externalReference: "payment-uuid",
      approvedAt: new Date("2024-05-10T00:00:00.000Z"),
    });
    vi.mocked(paymentRepository.findByPublicId).mockResolvedValue(pendingPayment());

    const useCaseSinValidacion = new ProcessPaymentWebhookUseCase(
      paymentRepository,
      reportRepository,
      paymentGateway,
      { ...config, validateWebhookSignature: false },
    );

    await useCaseSinValidacion.execute(validInput);

    expect(reportRepository.markFeatured).toHaveBeenCalledOnce();
    expect(paymentRepository.update).toHaveBeenCalledOnce();
  });

  it("ignora las notificaciones que no son de tipo payment", async () => {
    await useCase.execute({ ...validInput, type: "plan" });

    expect(paymentGateway.getPayment).not.toHaveBeenCalled();
    expect(reportRepository.markFeatured).not.toHaveBeenCalled();
  });

  it("lanza PaymentNotFoundError si no encuentra el pago por external_reference", async () => {
    vi.mocked(paymentGateway.getPayment).mockResolvedValue({
      mpPaymentId: "mp-999",
      status: "approved",
      externalReference: "payment-uuid",
      approvedAt: null,
    });
    vi.mocked(paymentRepository.findByPublicId).mockResolvedValue(null);

    await expect(useCase.execute(validInput)).rejects.toThrow(PaymentNotFoundError);
  });

  it("no destaca el reporte cuando el pago fue rechazado", async () => {
    vi.mocked(paymentGateway.getPayment).mockResolvedValue({
      mpPaymentId: "mp-999",
      status: "rejected",
      externalReference: "payment-uuid",
      approvedAt: null,
    });
    vi.mocked(paymentRepository.findByPublicId).mockResolvedValue(pendingPayment());

    await useCase.execute(validInput);

    expect(reportRepository.markFeatured).not.toHaveBeenCalled();
    expect(paymentRepository.update).toHaveBeenCalledOnce();
  });
});
