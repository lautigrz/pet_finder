export interface IEmailService {
  sendVerificationLink(toEmail: string, token: string): Promise<void>;
  sendPasswordResetLink(toEmail: string, token: string): Promise<void>;
}
