export interface IEmailService {
  sendVerificationLink(toEmail: string, token: string): Promise<void>;
  sendPasswordResetLink(toEmail: string, token: string): Promise<void>;
  sendMatchAlert(toEmail: string, petName: string, scorePercentage: number, lostReportPublicId: string, imageUrl: string | null): Promise<void>;
  sendPublicationRemovedNotice(toEmail: string): Promise<void>;
  sendAccountSuspendedNotice(toEmail: string, motive: string | null): Promise<void>;
}
