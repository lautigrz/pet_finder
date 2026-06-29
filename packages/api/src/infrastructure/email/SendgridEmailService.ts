import { IEmailService } from "@domain/services/IEmailService";
import { EmailAddress } from "@domain/shared/email/email-address.vo";

const SENDGRID_ENDPOINT = "https://api.sendgrid.com/v3/mail/send";

export class SendgridEmailService implements IEmailService {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly appBaseUrl: string,
  ) {}

  async sendVerificationLink(toEmail: string, token: string): Promise<void> {
    const link = `${this.appBaseUrl}/verify-email?token=${token}`;
    await this.send(toEmail, "Verificá tu cuenta en PetFinder", this.verificationHtml(link));
  }

  async sendPasswordResetLink(toEmail: string, token: string): Promise<void> {
    const link = `${this.appBaseUrl}/reset-password?token=${token}`;
    await this.send(toEmail, "Restablecé tu contraseña en PetFinder", this.resetHtml(link));
  }

  private async send(toEmail: string, subject: string, html: string): Promise<void> {
    const recipient = EmailAddress.create(toEmail);
    const response = await fetch(SENDGRID_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(this.payload(recipient.value, subject, html)),
    });
    if (!response.ok) {
      throw new Error(`SendGrid respondió ${response.status}: ${await response.text()}`);
    }
  }

  private payload(to: string, subject: string, html: string): unknown {
    return {
      personalizations: [{ to: [{ email: to }] }],
      from: this.parseFrom(),
      subject,
      content: [{ type: "text/html", value: html }],
    };
  }

  private parseFrom(): { email: string; name?: string } {
    const match = this.from.match(/^\s*(.*?)\s*<\s*(.+?)\s*>\s*$/);
    const email = match?.[2];
    if (!email) return { email: this.from.trim() };
    const name = match?.[1];
    return name ? { email, name } : { email };
  }

  private verificationHtml(link: string): string {
    return [
      "<p>¡Bienvenido a PetFinder!</p>",
      "<p>Verificá tu cuenta haciendo clic en el siguiente enlace:</p>",
      `<p><a href="${link}">Verificar mi cuenta</a></p>`,
      "<p>Si no creaste esta cuenta, ignorá este correo.</p>",
    ].join("");
  }

  private resetHtml(link: string): string {
    return [
      "<p>Recibimos un pedido para restablecer tu contraseña en PetFinder.</p>",
      "<p>Hacé clic en el siguiente enlace para elegir una nueva:</p>",
      `<p><a href="${link}">Restablecer mi contraseña</a></p>`,
      "<p>Si no pediste esto, ignorá este correo.</p>",
    ].join("");
  }
}
