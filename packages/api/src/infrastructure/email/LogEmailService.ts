import { IEmailService } from "../../domain/services/IEmailService";
import { AppealTargetType } from "../../domain/appeal/types/appeal-target-type";
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

  async sendFeaturedPaymentReceipt(toEmail: string, amount: number, currency: string, operationId: string, reportPublicId: string): Promise<void> {
    const link = `${APP_BASE_URL}/reports/${reportPublicId}`;
    logger.info(`[EMAIL MOCK] Comprobante de reporte destacado para ${toEmail}: ${amount} ${currency}, operación #${operationId} (${link})`);
  }

  async sendPublicationRemovedNotice(toEmail: string, appealToken: string): Promise<void> {
    logger.info(`[EMAIL MOCK] Publicación dada de baja para ${toEmail} (apelar: ${APP_BASE_URL}/appeals/new?token=${appealToken})`);
  }

  async sendAccountSuspendedNotice(toEmail: string, motive: string | null, appealToken: string): Promise<void> {
    logger.info(`[EMAIL MOCK] Cuenta suspendida para ${toEmail}. Motivo: ${motive ?? "sin especificar"} (apelar: ${APP_BASE_URL}/appeals/new?token=${appealToken})`);
  }

  async sendAppealAcceptedNotice(toEmail: string, targetType: AppealTargetType): Promise<void> {
    logger.info(`[EMAIL MOCK] Apelación aceptada (${targetType}) para ${toEmail}`);
  }

  async sendAppealRejectedNotice(toEmail: string, targetType: AppealTargetType): Promise<void> {
    logger.info(`[EMAIL MOCK] Apelación rechazada (${targetType}) para ${toEmail}`);
  }
}
