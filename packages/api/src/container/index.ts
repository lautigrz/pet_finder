import { container } from "tsyringe";

// ─── Prisma ────────────────────────────────────────────────────────────────────
// PrismaClient is registered as instance in infrastructure/prisma/prisma.client.ts
import "@infrastructure/prisma/prisma.client";

// ─── Config values ─────────────────────────────────────────────────────────────
import { readAuthConfig } from "@presentation/config/authConfig";

const { jwtSecret, accessTtl, refreshTtlMs } = readAuthConfig();
container.registerInstance("RefreshTtlMs", refreshTtlMs);

// ─── Repositories ──────────────────────────────────────────────────────────────
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { PrismaUserRepository } from "@infrastructure/repository/user/user.repository";

import { IUserExperienceRepository } from "@domain/repositories/IUserExperienceRepository";
import { IDeviceTokenRepository } from "@domain/repositories/IDeviceTokenRepository";
import { PrismaDeviceTokenRepository } from "@infrastructure/repository/device-token/device-token.repository";
import { IEmailVerificationTokenRepository } from "@domain/repositories/IEmailVerificationTokenRepository";
import { PrismaEmailVerificationTokenRepository } from "@infrastructure/repository/email-verification-token/email-verification-token.repository";
import { INotificationPreferencesRepository } from "@domain/repositories/INotificationPreferencesRepository";
import { PrismaNotificationPreferencesRepository } from "@infrastructure/repository/notification-preferences/notification-preferences.repository";
import { IPasswordResetTokenRepository } from "@domain/repositories/IPasswordResetTokenRepository";
import { PrismaPasswordResetTokenRepository } from "@infrastructure/repository/password-reset-token/password-reset-token.repository";
import { IRefreshTokenRepository } from "@domain/repositories/IRefreshTokenRepository";
import { PrismaRefreshTokenRepository } from "@infrastructure/repository/refresh-token/refresh-token.repository";
import { ConversationRepository } from "@domain/conversation/repositories/conversation.repository";
import { PrismaConversationRepository } from "@infrastructure/repository/conversation/conversation.repository";
import { MessageRepository } from "@domain/message/repositories/message.repository";
import { PrismaMessageRepository } from "@infrastructure/repository/message/message.repository";
import { MatchResultsRepository } from "@domain/match/repositories/match-results.repository";
import { PrismaMatchResultsRepository } from "@infrastructure/repository/match/match-results.repository";
import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { PrismaPetRepository } from "@infrastructure/repository/pet/pet.repository";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { PrismaReportRepository } from "@infrastructure/repository/report/report.repository";
import { ReportFollowerRepository } from "@domain/report/repositories/report-follower.repository";
import { PrismaReportFollowerRepository } from "@infrastructure/repository/report/report-follower.repository";
import { CatalogRepository } from "@domain/catalog/catalog.repository";
import { PrismaCatalogRepository } from "@infrastructure/repository/catalog/catalog.repository";
import { ContentReportRepository } from "@domain/content-report/repositories/content-report.repository";
import { PrismaContentReportRepository } from "@infrastructure/repository/content-report/content-report.repository";
import { MatchViewsRepository } from "@domain/match/repositories/match-views.repository";
import { PrismaMatchViewsRepository } from "@infrastructure/repository/match/match-views.repository";

container.registerSingleton<IUserRepository>("UserRepository", PrismaUserRepository);
container.registerSingleton<IUserExperienceRepository>("UserExperienceRepository", PrismaUserRepository);
container.registerSingleton<IDeviceTokenRepository>("DeviceTokenRepository", PrismaDeviceTokenRepository);
container.registerSingleton<IEmailVerificationTokenRepository>("EmailVerificationTokenRepository", PrismaEmailVerificationTokenRepository);
container.registerSingleton<INotificationPreferencesRepository>("NotificationPreferencesRepository", PrismaNotificationPreferencesRepository);
container.registerSingleton<IPasswordResetTokenRepository>("PasswordResetTokenRepository", PrismaPasswordResetTokenRepository);
container.registerSingleton<IRefreshTokenRepository>("RefreshTokenRepository", PrismaRefreshTokenRepository);
container.registerSingleton<ConversationRepository>("ConversationRepository", PrismaConversationRepository);
container.registerSingleton<MessageRepository>("MessageRepository", PrismaMessageRepository);
container.registerSingleton<MatchResultsRepository>("MatchResultsRepository", PrismaMatchResultsRepository);
container.registerSingleton<PetRepository>("PetRepository", PrismaPetRepository);
container.registerSingleton<ReportRepository>("ReportRepository", PrismaReportRepository);
container.registerSingleton<ReportFollowerRepository>("ReportFollowerRepository", PrismaReportFollowerRepository);
container.registerSingleton<CatalogRepository>("CatalogRepository", PrismaCatalogRepository);
container.registerSingleton<ContentReportRepository>("ContentReportRepository", PrismaContentReportRepository);
container.registerSingleton<MatchViewsRepository>("MatchViewsRepository", PrismaMatchViewsRepository);

// ─── Services ──────────────────────────────────────────────────────────────────
import { ITokenSigner } from "@domain/services/ITokenSigner";
import { JwtTokenSigner } from "@infrastructure/security/JwtTokenSigner";
import { IPasswordHasher } from "@domain/services/IPasswordHasher";
import { BcryptPasswordHasher } from "@infrastructure/security/BcryptPasswordHasher";
import { ITokenGenerator } from "@domain/services/ITokenGenerator";
import { CryptoTokenGenerator } from "@infrastructure/security/CryptoTokenGenerator";
import { IEmailService } from "@domain/services/IEmailService";
import { createEmailService } from "@infrastructure/email/email-service.factory";
import { IPushSender } from "@domain/services/IPushSender";
import { createPushSender } from "@infrastructure/push/push-sender.factory";
import { StorageService } from "@application/ports/StorageService";
import { ClaudinaryService } from "@infrastructure/storage/CloudinaryService";

container.registerInstance<ITokenSigner>("TokenSigner", new JwtTokenSigner(jwtSecret, accessTtl));
container.registerSingleton<IPasswordHasher>("PasswordHasher", BcryptPasswordHasher);
container.registerSingleton<ITokenGenerator>("TokenGenerator", CryptoTokenGenerator);
container.registerInstance<IEmailService>("EmailService", createEmailService());
container.registerInstance<IPushSender>("PushSender", createPushSender());
container.registerSingleton<StorageService>("StorageService", ClaudinaryService);

// ─── Use Cases ─────────────────────────────────────────────────────────────────
// Auth
import { LoginUserUseCase } from "@application/usecase/login-user/login-user.usecase";
import { LogoutUserUseCase } from "@application/usecase/logout-user/logout-user.usecase";
import { RefreshAccessTokenUseCase } from "@application/usecase/refresh-access-token/refresh-access-token.usecase";
import { RegisterUserUseCase } from "@application/usecase/register-user/register-user.usecase";
import { VerifyEmailUseCase } from "@application/usecase/verify-email/verify-email.usecase";
import { RequestPasswordResetUseCase } from "@application/usecase/request-password-reset/request-password-reset.usecase";
import { ResetPasswordUseCase } from "@application/usecase/reset-password/reset-password.usecase";

container.registerSingleton("LoginUserUseCase", LoginUserUseCase);
container.registerSingleton("LogoutUserUseCase", LogoutUserUseCase);
container.registerSingleton("RefreshAccessTokenUseCase", RefreshAccessTokenUseCase);
container.registerSingleton("RegisterUserUseCase", RegisterUserUseCase);
container.registerSingleton("VerifyEmailUseCase", VerifyEmailUseCase);
container.registerSingleton("RequestPasswordResetUseCase", RequestPasswordResetUseCase);
container.registerSingleton("ResetPasswordUseCase", ResetPasswordUseCase);

// User / Profile
import { GetProfileUseCase } from "@application/usecase/get-profile/get-profile.usecase";
import { GetPublicProfileUseCase } from "@application/usecase/get-public-profile/get-public-profile.usecase";
import { UpdateProfileUseCase } from "@application/usecase/update-profile/update-profile.usecase";
import { GetNotificationPreferencesUseCase } from "@application/usecase/get-notification-preferences/get-notification-preferences.usecase";
import { UpdateNotificationPreferencesUseCase } from "@application/usecase/update-notification-preferences/update-notification-preferences.usecase";
import { AwardUserExpUseCase } from "@application/usecase/award-user-exp/award-user-exp.usecase";

container.registerSingleton("GetProfileUseCase", GetProfileUseCase);
container.registerSingleton("GetPublicProfileUseCase", GetPublicProfileUseCase);
container.registerSingleton("UpdateProfileUseCase", UpdateProfileUseCase);
container.registerSingleton("GetNotificationPreferencesUseCase", GetNotificationPreferencesUseCase);
container.registerSingleton("UpdateNotificationPreferencesUseCase", UpdateNotificationPreferencesUseCase);
container.registerSingleton("AwardUserExpUseCase", AwardUserExpUseCase);

// Device tokens / Push
import { RegisterDeviceTokenUseCase } from "@application/usecase/register-device-token/register-device-token.usecase";
import { RemoveDeviceTokenUseCase } from "@application/usecase/remove-device-token/remove-device-token.usecase";
import { SendPushToUserUseCase } from "@application/usecase/send-push-to-user/send-push-to-user.usecase";

container.registerSingleton("RegisterDeviceTokenUseCase", RegisterDeviceTokenUseCase);
container.registerSingleton("RemoveDeviceTokenUseCase", RemoveDeviceTokenUseCase);
container.registerSingleton("SendPushToUserUseCase", SendPushToUserUseCase);

// Conversations
import { CreateConversationUseCase } from "@application/usecase/conversation-usecase/create-conversation.usecase";
import { GetConversationUseCase } from "@application/usecase/conversation-usecase/get-conversation.usecase";
import { ListMyConversationsUseCase } from "@application/usecase/conversation-usecase/list-my-conversations.usecase";

container.registerSingleton("CreateConversationUseCase", CreateConversationUseCase);
container.registerSingleton("GetConversationUseCase", GetConversationUseCase);
container.registerSingleton("ListConversationUseCase", ListMyConversationsUseCase);

// Messages
import { SendMessageUseCase } from "@application/usecase/message-usecase/send-message.usecase";
import { ReadMessageUseCase } from "@application/usecase/message-usecase/read-message.usecase";

container.registerSingleton("SendMessageUseCase", SendMessageUseCase);
container.registerSingleton("ReadMessageUseCase", ReadMessageUseCase);

// Match
import { GetMatchResultsUseCase } from "@application/usecase/match-results-usecase/get-match-results.usecase";
import { GetUserMatchNotificationsUseCase } from "@application/usecase/match-results-usecase/get-user-match-notifications.usecase";

container.registerSingleton("GetMatchResultsUseCase", GetMatchResultsUseCase);
container.registerSingleton("GetUserMatchNotificationsUseCase", GetUserMatchNotificationsUseCase);

import { MarkMatchSeenUseCase } from "@application/usecase/match-views-usecase/mark-match-seen.usecase";
import { GetSeenMatchesUseCase } from "@application/usecase/match-views-usecase/get-seen-matches.usecase";

container.registerSingleton("MarkMatchSeenUseCase", MarkMatchSeenUseCase);
container.registerSingleton("GetSeenMatchesUseCase", GetSeenMatchesUseCase);

// Pets
import { CreatePetUseCase } from "@application/usecase/pet-usecase/create-pet.usecase";
import { GetPetsUseCase } from "@application/usecase/pet-usecase/get-user-pets.usecase";

container.registerSingleton("CreatePetUseCase", CreatePetUseCase);
container.registerSingleton("GetPetsUseCase", GetPetsUseCase);

// Reports
import { CreateReportUseCase } from "@application/usecase/report-usecase/create-report.usecase";
import { GetReportUseCase } from "@application/usecase/report-usecase/get-report-usecase";
import { GetFilteredReportsUseCase } from "@application/usecase/report-usecase/get-filter-reports.usecase";
import { ListUserReportsUseCase } from "@application/usecase/report-usecase/list-user-reports.usecase";
import { ListReportsByUserUseCase } from "@application/usecase/report-usecase/list-reports-by-user.usecase";
import { UpdateReportUseCase } from "@application/usecase/report-usecase/update-report.usecase";
import { UpdateStatus } from "@application/usecase/report-usecase/update-status-report";
import { FollowReportUseCase } from "@application/usecase/report-usecase/follow-report.usecase";
import { UnfollowReportUseCase } from "@application/usecase/report-usecase/unfollow-report.usecase";
import { IsFollowingReportUseCase } from "@application/usecase/report-usecase/is-following-report.usecase";
import { NotifyReportFollowersOfStatusChangeUseCase } from "@application/usecase/report-usecase/notify-report-followers-of-status-change.usecase";

container.registerSingleton("CreateReportUseCase", CreateReportUseCase);
container.registerSingleton("GetReportUseCase", GetReportUseCase);
container.registerSingleton("GetFilteredReportsUseCase", GetFilteredReportsUseCase);
container.registerSingleton("ListUserReportsUseCase", ListUserReportsUseCase);
container.registerSingleton("ListReportsByUserUseCase", ListReportsByUserUseCase);
container.registerSingleton("UpdateReportUseCase", UpdateReportUseCase);
container.registerSingleton("UpdateStatusUseCase", UpdateStatus);
container.registerSingleton("FollowReportUseCase", FollowReportUseCase);
container.registerSingleton("UnfollowReportUseCase", UnfollowReportUseCase);
container.registerSingleton("IsFollowingReportUseCase", IsFollowingReportUseCase);
container.registerSingleton("NotifyReportFollowersOfStatusChangeUseCase", NotifyReportFollowersOfStatusChangeUseCase);

// Content reports (moderation)
import { CreateContentReportUseCase } from "@application/usecase/content-report-usecase/create-content-report.usecase";
import { GetContentReportQueueUseCase } from "@application/usecase/content-report-usecase/get-content-report-queue.usecase";
import { ResolveContentReportUseCase } from "@application/usecase/content-report-usecase/resolve-content-report.usecase";

container.registerSingleton("CreateContentReportUseCase", CreateContentReportUseCase);
container.registerSingleton("GetContentReportQueueUseCase", GetContentReportQueueUseCase);
container.registerSingleton("ResolveContentReportUseCase", ResolveContentReportUseCase);

// Notifications (push + email)
import { NotifyNearbyLostOwnersUseCase } from "@application/usecase/notify-nearby-lost-owners/notify-nearby-lost-owners.usecase";
import { NotifyOwnerOfMatchUseCase } from "@application/usecase/notify-owner-of-match/notify-owner-of-match.usecase";
import { NotifyOwnerOfContentSentenceUseCase } from "@application/usecase/notify-owner-of-content-sentence/notify-owner-of-content-sentence.usecase";

container.registerSingleton("NotifyNearbyLostOwnersUseCase", NotifyNearbyLostOwnersUseCase);
container.registerSingleton("NotifyOwnerOfMatchUseCase", NotifyOwnerOfMatchUseCase);
container.registerSingleton("NotifyOwnerOfContentSentenceUseCase", NotifyOwnerOfContentSentenceUseCase);

// Catalog
import { GetBreedsUseCase } from "@application/usecase/catalog/get-breeds.usecase";
import { GetColorsUseCase } from "@application/usecase/catalog/get-colors.usecase";

container.registerSingleton("GetBreedsUseCase", GetBreedsUseCase);
container.registerSingleton("GetColorsUseCase", GetColorsUseCase);
