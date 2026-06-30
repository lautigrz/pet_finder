export interface IEmailService {
  sendVerificationLink(toEmail: string, token: string): Promise<void>;
  sendPasswordResetLink(toEmail: string, token: string): Promise<void>;
  sendMatchAlert(toEmail: string, petName: string, scorePercentage: number, lostReportPublicId: string): Promise<void>;
}
