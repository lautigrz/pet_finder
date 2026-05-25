import { IEmailService } from "../../domain/services/IEmailService";
import logger from "../logger";

export class LogEmailService implements IEmailService {
  async sendVerificationLink(toEmail: string, token: string): Promise<void> {
    logger.info(
      `[EMAIL MOCK] Verification link for ${toEmail}: POST /api/users/verify-email body { "token": "${token}" }`,
    );
  }
}
