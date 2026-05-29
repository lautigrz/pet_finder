export interface IEmailService {
  sendVerificationLink(toEmail: string, token: string): Promise<void>;
}
