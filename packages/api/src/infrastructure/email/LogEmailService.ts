import { IEmailService } from "../../domain/services/IEmailService";
import { logger } from '@pet-alert/shared';

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

  async sendMatchAlert(toEmail: string, petName: string, scorePercentage: number, lostReportPublicId: string, imageUrl: string | null): Promise<void> {
    const link = `${APP_BASE_URL}/reports/${lostReportPublicId}/matches`;
    logger.info(`[EMAIL MOCK] Coincidencia ${scorePercentage}% con ${petName} (img: ${imageUrl ?? "sin foto"}) para ${toEmail}: ${link}`);
  }

  async sendPublicationRemovedNotice(toEmail: string): Promise<void> {
    logger.info(`[EMAIL MOCK] Publicación dada de baja para ${toEmail}`);
  }

  async sendAccountSuspendedNotice(toEmail: string, motive: string | null): Promise<void> {
    logger.info(`[EMAIL MOCK] Cuenta suspendida para ${toEmail}. Motivo: ${motive ?? "sin especificar"}`);
  }
}
