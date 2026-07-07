import { describe, expect, it, vi, beforeEach } from "vitest";
import { NotifyFeaturedPaymentUseCase } from "../notify-featured-payment.usecase";
import type { IUserRepository } from "../../../../domain/repositories/IUserRepository";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { IEmailService } from "../../../../domain/services/IEmailService";

describe("NotifyFeaturedPaymentUseCase", () => {
  let userRepository: IUserRepository;
  let reportRepository: ReportRepository;
  let emailService: IEmailService;
  let useCase: NotifyFeaturedPaymentUseCase;

  const input = {
    userId: 5,
    reportId: 7,
    amount: 100,
    currency: "ARS",
    operationId: "mp-999",
  };

  beforeEach(() => {
    userRepository = {
      findById: vi.fn().mockResolvedValue({ email: "owner@test.com" }),
    } as unknown as IUserRepository;

    reportRepository = {
      findDetailsByIds: vi.fn().mockResolvedValue([
        { report: { publicId: "report-public-id" }, pet: {} },
      ]),
    } as unknown as ReportRepository;

    emailService = {
      sendFeaturedPaymentReceipt: vi.fn().mockResolvedValue(undefined),
    } as unknown as IEmailService;

    useCase = new NotifyFeaturedPaymentUseCase(userRepository, reportRepository, emailService);
  });

  it("sends the payment receipt to the report owner", async () => {
    await useCase.execute(input);

    expect(reportRepository.findDetailsByIds).toHaveBeenCalledWith([7]);
    expect(emailService.sendFeaturedPaymentReceipt).toHaveBeenCalledWith(
      "owner@test.com",
      100,
      "ARS",
      "mp-999",
      "report-public-id",
    );
  });

  it("does nothing when the user is not found", async () => {
    vi.mocked(userRepository.findById).mockResolvedValueOnce(null);

    await useCase.execute(input);

    expect(emailService.sendFeaturedPaymentReceipt).not.toHaveBeenCalled();
  });

  it("does nothing when the report is not found", async () => {
    vi.mocked(reportRepository.findDetailsByIds).mockResolvedValueOnce([]);

    await useCase.execute(input);

    expect(emailService.sendFeaturedPaymentReceipt).not.toHaveBeenCalled();
  });
});
