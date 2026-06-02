import { Transporter } from "nodemailer";
import { IEmailService } from "@domain/services/IEmailService";
import { EmailAddress } from "@domain/shared/email/email-address.vo";

type MailSender = Pick<Transporter, "sendMail">;

export class NodemailerEmailService implements IEmailService {
  constructor(
    private readonly transporter: MailSender,
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
    await this.transporter.sendMail({ from: this.from, to: recipient.value, subject, html });
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
