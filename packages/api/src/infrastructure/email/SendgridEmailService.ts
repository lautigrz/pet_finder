import { IEmailService } from "@domain/services/IEmailService";
import { EmailAddress } from "@domain/shared/email/email-address.vo";
import { verificationEmail, passwordResetEmail, matchAlertEmail, publicationRemovedEmail, accountSuspendedEmail } from "./email-templates";
import { PETFINDER_LOGO_BASE64, PETFINDER_LOGO_CID, PETFINDER_ISOTIPO_BASE64, PETFINDER_ISOTIPO_CID } from "./email-logo-asset";

const SENDGRID_ENDPOINT = "https://api.sendgrid.com/v3/mail/send";

type InlineImage = { content: string; filename: string; type: string; disposition: string; content_id: string };

export class SendgridEmailService implements IEmailService {
  constructor(
    private readonly apiKey: string,
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

  async sendPublicationRemovedNotice(toEmail: string): Promise<void> {
    await this.send(toEmail, "Tu publicación fue dada de baja en PetFinder", publicationRemovedEmail());
  }

  async sendAccountSuspendedNotice(toEmail: string, motive: string | null): Promise<void> {
    await this.send(toEmail, "Tu cuenta fue suspendida en PetFinder", accountSuspendedEmail(motive));
  }

  private async send(toEmail: string, subject: string, html: string, extraImages: InlineImage[] = []): Promise<void> {
    const recipient = EmailAddress.create(toEmail);
    const response = await fetch(SENDGRID_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(this.payload(recipient.value, subject, html, extraImages)),
    });
    if (!response.ok) {
      throw new Error(`SendGrid respondió ${response.status}: ${await response.text()}`);
    }
  }

  private payload(to: string, subject: string, html: string, extraImages: InlineImage[]): unknown {
    const logo = inlineImage(PETFINDER_LOGO_BASE64, "petfinder-logo.png", PETFINDER_LOGO_CID);
    return {
      personalizations: [{ to: [{ email: to }] }],
      from: this.parseFrom(),
      subject,
      content: [{ type: "text/html", value: html }],
      attachments: [logo, ...extraImages],
    };
  }

  private parseFrom(): { email: string; name?: string } {
    const match = this.from.match(/^\s*(.*?)\s*<\s*(.+?)\s*>\s*$/);
    const email = match?.[2];
    if (!email) return { email: this.from.trim() };
    const name = match?.[1];
    return name ? { email, name } : { email };
  }
}

function inlineImage(base64: string, filename: string, cid: string): InlineImage {
  return { content: base64, filename, type: "image/png", disposition: "inline", content_id: cid };
}
