import { IEmailService } from "../../domain/services/IEmailService";
import logger from "../logger";

const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:4200";

export class LogEmailService implements IEmailService {
  async sendVerificationLink(toEmail: string, token: string): Promise<void> {
    const link = `${APP_BASE_URL}/verify-email?token=${token}`;
    logger.info(`[EMAIL MOCK] Verificación de cuenta para ${toEmail}: ${link}`);
  }

  async sendPasswordResetLink(toEmail: string, token: string): Promise<void> {
    const link = `${APP_BASE_URL}/reset-password?token=${token}`;
    logger.info(`[EMAIL MOCK] Reset de contraseña para ${toEmail}: ${link}`);
  }
}
