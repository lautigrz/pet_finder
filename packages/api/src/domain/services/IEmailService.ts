import { AppealTargetType } from "../appeal/types/appeal-target-type";

export interface IEmailService {
  sendVerificationLink(toEmail: string, token: string): Promise<void>;
  sendPasswordResetLink(toEmail: string, token: string): Promise<void>;
  sendMatchAlert(toEmail: string, petName: string, scorePercentage: number, lostReportPublicId: string, imageUrl: string | null): Promise<void>;
  sendFeaturedPaymentReceipt(toEmail: string, amount: number, currency: string, operationId: string, reportPublicId: string): Promise<void>;
  sendPublicationRemovedNotice(toEmail: string, appealToken: string): Promise<void>;
  sendAccountSuspendedNotice(toEmail: string, motive: string | null, appealToken: string): Promise<void>;
  sendAppealAcceptedNotice(toEmail: string, targetType: AppealTargetType): Promise<void>;
  sendAppealRejectedNotice(toEmail: string, targetType: AppealTargetType): Promise<void>;
}
