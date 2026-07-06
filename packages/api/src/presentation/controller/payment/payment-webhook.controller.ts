import { Request, Response } from "express";
import { ProcessPaymentWebhookUseCase } from "@application/usecase/payment-usecase/process-payment-webhook.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { PaymentWebhookBody, PaymentWebhookQuery } from "@presentation/schemas/payment/payment-webhook.schema";
import { inject, injectable } from "tsyringe";

@injectable()
export class PaymentWebhookController {
  constructor(
    @inject("ProcessPaymentWebhookUseCase")
    private readonly processPaymentWebhookUseCase: ProcessPaymentWebhookUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = (req.validated?.body ?? {}) as PaymentWebhookBody;
    const query = (req.validated?.query ?? {}) as PaymentWebhookQuery;

    const type = body.type ?? query.type ?? query.topic ?? "";
    const dataId = body.data?.id ?? query["data.id"] ?? query.id ?? "";

    if (dataId) {
      await this.processPaymentWebhookUseCase.execute({
        type,
        dataId,
        xSignature: req.header("x-signature"),
        xRequestId: req.header("x-request-id"),
      });
    }

    res.sendStatus(200);
  });
}
