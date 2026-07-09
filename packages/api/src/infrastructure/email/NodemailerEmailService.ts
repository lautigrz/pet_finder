import { Transporter } from "nodemailer";
import { IEmailService } from "@domain/services/IEmailService";
import { EmailAddress } from "@domain/shared/email/email-address.vo";
import { verificationEmail, passwordResetEmail, matchAlertEmail, featuredPaymentReceiptEmail, publicationRemovedEmail, accountSuspendedEmail, appealAcceptedEmail, appealRejectedEmail } from "./email-templates";
import { AppealTargetType } from "@domain/appeal/types/appeal-target-type";
import { PETFINDER_LOGO_BASE64, PETFINDER_LOGO_CID, PETFINDER_ISOTIPO_BASE64, PETFINDER_ISOTIPO_CID } from "./email-logo-asset";

type MailSender = Pick<Transporter, "sendMail">;
type InlineImage = { filename: string; content: Buffer; cid: string };

export class NodemailerEmailService implements IEmailService {
  constructor(
    private readonly transporter: MailSender,
    private readonly from: string,
    private readonly appBaseUrl: string,
  ) {}

  async sendVerificationLink(toEmail: string, token: string): Promise<void> {
    await this.send(toEmail, "Verificá tu cuenta en PetFinder", verificationEmail(this.appBaseUrl, token));
  }

  async sendPasswordResetLink(toEmail: string, token: string): Promise<void> {
    await this.send(toEmail, "Restablecé tu contraseña en PetFinder", passwordResetEmail(this.appBaseUrl, token));
  }

  async sendMatchAlert(toEmail: string, petName: string, scorePercentage: number, lostReportPublicId: string, imageUrl: string | null): Promise<void> {
    const html = matchAlertEmail(this.appBaseUrl, petName, scorePercentage, lostReportPublicId, imageUrl);
    const extras = imageUrl ? [] : [inlineImage(PETFINDER_ISOTIPO_BASE64, "petfinder-isotipo.png", PETFINDER_ISOTIPO_CID)];
    await this.send(toEmail, "Encontramos una posible coincidencia en PetFinder", html, extras);
  }

  async sendFeaturedPaymentReceipt(toEmail: string, amount: number, currency: string, operationId: string, reportPublicId: string): Promise<void> {
    const html = featuredPaymentReceiptEmail(this.appBaseUrl, amount, currency, operationId, reportPublicId);
    await this.send(toEmail, "Comprobante de tu reporte destacado en PetFinder", html);
  }

  async sendPublicationRemovedNotice(toEmail: string, appealToken: string): Promise<void> {
    await this.send(toEmail, "Tu publicación fue dada de baja en PetFinder", publicationRemovedEmail(this.appealUrl(appealToken)));
  }

  async sendAccountSuspendedNotice(toEmail: string, motive: string | null, appealToken: string): Promise<void> {
    await this.send(toEmail, "Tu cuenta fue suspendida en PetFinder", accountSuspendedEmail(motive, this.appealUrl(appealToken)));
  }

  private appealUrl(token: string): string {
    return `${this.appBaseUrl}/appeals/new?token=${token}`;
  }

  async sendAppealAcceptedNotice(toEmail: string, targetType: AppealTargetType): Promise<void> {
    await this.send(toEmail, "Tu apelación fue aceptada en PetFinder", appealAcceptedEmail(targetType));
  }

  async sendAppealRejectedNotice(toEmail: string, targetType: AppealTargetType): Promise<void> {
    await this.send(toEmail, "Novedades de tu apelación en PetFinder", appealRejectedEmail(targetType));
  }

  private async send(toEmail: string, subject: string, html: string, extraImages: InlineImage[] = []): Promise<void> {
    const recipient = EmailAddress.create(toEmail);
    const logo = inlineImage(PETFINDER_LOGO_BASE64, "petfinder-logo.png", PETFINDER_LOGO_CID);
    await this.transporter.sendMail({ from: this.from, to: recipient.value, subject, html, attachments: [logo, ...extraImages] });
  }
}

function inlineImage(base64: string, filename: string, cid: string): InlineImage {
  return { filename, content: Buffer.from(base64, "base64"), cid };
}
