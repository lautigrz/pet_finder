import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateFeaturedPreferenceUseCase } from "../create-featured-preference.usecase";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { PaymentRepository } from "@domain/payment/repositories/payment.repository";
import { PaymentGateway } from "@domain/payment/gateway/payment-gateway";
import { PaymentConfig } from "@application/ports/PaymentConfig";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { ReportStatus } from "@domain/report/types/report.status";
import { Location } from "@domain/report/value-objects/location.vo";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { UnauthorizedFeatureReportError } from "@domain/payment/errors/UnauthorizedFeatureReportError";
import { ReportAlreadyFeaturedError } from "@domain/payment/errors/ReportAlreadyFeaturedError";

const validLocation = Location.create({
  address: "Av. Corrientes 1234",
  latitude: -34.603722,
  longitude: -58.381592,
});

function buildReport(overrides?: { featured?: boolean; status?: ReportStatus; userPublicId?: string }): Report {
  return Report.restore({
    idReport: 1,
    publicId: "report-uuid",
    userId: 5,
    userPublicId: overrides?.userPublicId ?? "owner-pub-id",
    type: ReportType.LOST,
    currentStatus: overrides?.status ?? ReportStatus.ACTIVE,
    description: null,
    details: LostReportDetails.create({ petId: 10 }),
    location: validLocation,
    occurredAt: new Date("2024-05-01"),
    createdAt: new Date("2024-05-01"),
    updatedAt: null,
    featured: overrides?.featured ?? false,
  });
}

const config: PaymentConfig = {
  featuredPrice: 1500,
  currency: "ARS",
  frontendBaseUrl: "http://localhost:4200",
  notificationUrl: "http://localhost:3000/api/payments/webhook",
  validateWebhookSignature: true,
};

describe("CreateFeaturedPreferenceUseCase", () => {
  let reportRepository: ReportRepository;
  let paymentRepository: PaymentRepository;
  let paymentGateway: PaymentGateway;
  let useCase: CreateFeaturedPreferenceUseCase;

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
      createPreference: vi.fn().mockResolvedValue({
        preferenceId: "pref-123",
        initPoint: "https://mercadopago.com/init/pref-123",
      }),
      getPayment: vi.fn(),
      verifySignature: vi.fn(),
    } as unknown as PaymentGateway;

    useCase = new CreateFeaturedPreferenceUseCase(reportRepository, paymentRepository, paymentGateway, config);
  });

  it("crea la preferencia, guarda el pago y retorna el init_point", async () => {
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(buildReport());

    const result = await useCase.execute({ reportPublicId: "report-uuid", userPublicId: "owner-pub-id" });

    expect(result.initPoint).toBe("https://mercadopago.com/init/pref-123");
    expect(paymentGateway.createPreference).toHaveBeenCalledOnce();
    expect(paymentRepository.save).toHaveBeenCalledOnce();
  });

  it("usa el precio y la moneda de la configuracion", async () => {
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(buildReport());

    await useCase.execute({ reportPublicId: "report-uuid", userPublicId: "owner-pub-id" });

    expect(paymentGateway.createPreference).toHaveBeenCalledWith(
      expect.objectContaining({ unitPrice: 1500, currency: "ARS" }),
    );
  });

  it("lanza ReportNotFoundError si el reporte no existe", async () => {
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(null);

    await expect(
      useCase.execute({ reportPublicId: "missing-uuid", userPublicId: "owner-pub-id" }),
    ).rejects.toThrow(ReportNotFoundError);
    expect(paymentGateway.createPreference).not.toHaveBeenCalled();
  });

  it("lanza UnauthorizedFeatureReportError si el reporte no es del usuario", async () => {
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(buildReport({ userPublicId: "other-user" }));

    await expect(
      useCase.execute({ reportPublicId: "report-uuid", userPublicId: "owner-pub-id" }),
    ).rejects.toThrow(UnauthorizedFeatureReportError);
    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it("lanza ReportAlreadyFeaturedError si el reporte ya esta destacado y activo", async () => {
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(
      buildReport({ featured: true }),
    );

    await expect(
      useCase.execute({ reportPublicId: "report-uuid", userPublicId: "owner-pub-id" }),
    ).rejects.toThrow(ReportAlreadyFeaturedError);
    expect(paymentGateway.createPreference).not.toHaveBeenCalled();
  });

  it("permite crear la preferencia si el reporte destacado ya no esta activo (resuelto)", async () => {
    vi.mocked(reportRepository.findByPublicId).mockResolvedValue(
      buildReport({ featured: true, status: ReportStatus.RESOLVED }),
    );

    const result = await useCase.execute({ reportPublicId: "report-uuid", userPublicId: "owner-pub-id" });

    expect(result.initPoint).toBe("https://mercadopago.com/init/pref-123");
    expect(paymentRepository.save).toHaveBeenCalledOnce();
  });
});
