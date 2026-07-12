import { container } from "tsyringe";

// ─── Prisma ────────────────────────────────────────────────────────────────────
// PrismaClient is registered as instance in infrastructure/prisma/prisma.client.ts
import "@infrastructure/prisma/prisma.client";

// ─── Config values ─────────────────────────────────────────────────────────────
import { readAuthConfig } from "@presentation/config/authConfig";
import { readPaymentConfig, readMercadoPagoCredentials } from "@presentation/config/paymentConfig";
import { PaymentConfig } from "@application/ports/PaymentConfig";

const { jwtSecret, accessTtl, refreshTtlMs, googleClientId, googleClientSecret } = readAuthConfig();
container.registerInstance("RefreshTtlMs", refreshTtlMs);

const paymentConfig = readPaymentConfig();
container.registerInstance<PaymentConfig>("PaymentConfig", paymentConfig);

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
import { AdminStatsRepository } from "@domain/stats/repositories/admin-stats.repository";
import { PrismaAdminStatsRepository } from "@infrastructure/repository/stats/prisma-admin-stats.repository";
import { MatchViewsRepository } from "@domain/match/repositories/match-views.repository";
import { PrismaMatchViewsRepository } from "@infrastructure/repository/match/match-views.repository";
import { PaymentRepository } from "@domain/payment/repositories/payment.repository";
import { PrismaPaymentRepository } from "@infrastructure/repository/payment/payment.repository";
import { AppealRepository } from "@domain/appeal/repositories/appeal.repository";
import { PrismaAppealRepository } from "@infrastructure/repository/appeal/appeal.repository";
import { IUserReviewRepository } from "@domain/repositories/IUserReviewRepository";
import { PrismaUserReviewRepository } from "@infrastructure/repository/user-review/user-review.repository";

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
container.registerSingleton<AdminStatsRepository>("AdminStatsRepository", PrismaAdminStatsRepository);
container.registerSingleton<MatchViewsRepository>("MatchViewsRepository", PrismaMatchViewsRepository);
container.registerSingleton<PaymentRepository>("PaymentRepository", PrismaPaymentRepository);
container.registerSingleton<AppealRepository>("AppealRepository", PrismaAppealRepository);

container.registerSingleton<IUserRepository>(
  "UserRepository",
  PrismaUserRepository,
);
container.registerSingleton<IUserExperienceRepository>(
  "UserExperienceRepository",
  PrismaUserRepository,
);
container.registerSingleton<IDeviceTokenRepository>(
  "DeviceTokenRepository",
  PrismaDeviceTokenRepository,
);
container.registerSingleton<IEmailVerificationTokenRepository>(
  "EmailVerificationTokenRepository",
  PrismaEmailVerificationTokenRepository,
);
container.registerSingleton<INotificationPreferencesRepository>(
  "NotificationPreferencesRepository",
  PrismaNotificationPreferencesRepository,
);
container.registerSingleton<IPasswordResetTokenRepository>(
  "PasswordResetTokenRepository",
  PrismaPasswordResetTokenRepository,
);
container.registerSingleton<IRefreshTokenRepository>(
  "RefreshTokenRepository",
  PrismaRefreshTokenRepository,
);
container.registerSingleton<ConversationRepository>(
  "ConversationRepository",
  PrismaConversationRepository,
);
container.registerSingleton<MessageRepository>(
  "MessageRepository",
  PrismaMessageRepository,
);
container.registerSingleton<MatchResultsRepository>(
  "MatchResultsRepository",
  PrismaMatchResultsRepository,
);
container.registerSingleton<PetRepository>(
  "PetRepository",
  PrismaPetRepository,
);
container.registerSingleton<ReportRepository>(
  "ReportRepository",
  PrismaReportRepository,
);
container.registerSingleton<ReportFollowerRepository>(
  "ReportFollowerRepository",
  PrismaReportFollowerRepository,
);
container.registerSingleton<CatalogRepository>(
  "CatalogRepository",
  PrismaCatalogRepository,
);
container.registerSingleton<ContentReportRepository>(
  "ContentReportRepository",
  PrismaContentReportRepository,
);
container.registerSingleton<MatchViewsRepository>(
  "MatchViewsRepository",
  PrismaMatchViewsRepository,
);
container.registerSingleton<AppealRepository>(
  "AppealRepository",
  PrismaAppealRepository,
);
container.registerSingleton<IUserReviewRepository>(
  "UserReviewRepository",
  PrismaUserReviewRepository,
);


// ─── Services ──────────────────────────────────────────────────────────────────
import { ITokenSigner } from "@domain/services/ITokenSigner";
import { JwtTokenSigner } from "@infrastructure/security/JwtTokenSigner";
import { IAppealTokenSigner } from "@domain/services/IAppealTokenSigner";
import { JwtAppealTokenSigner } from "@infrastructure/security/JwtAppealTokenSigner";
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
import { PaymentGateway } from "@domain/payment/gateway/payment-gateway";
import { MercadoPagoGateway } from "@infrastructure/payment/mercado-pago.gateway";

container.registerInstance<ITokenSigner>(
  "TokenSigner",
  new JwtTokenSigner(jwtSecret, accessTtl),
);
container.registerInstance<IAppealTokenSigner>(
  "AppealTokenSigner",
  new JwtAppealTokenSigner(jwtSecret, "30d"),
);
container.registerSingleton<IPasswordHasher>(
  "PasswordHasher",
  BcryptPasswordHasher,
);
container.registerSingleton<ITokenGenerator>(
  "TokenGenerator",
  CryptoTokenGenerator,
);
container.registerInstance<IEmailService>("EmailService", createEmailService());
container.registerInstance<IPushSender>("PushSender", createPushSender());
container.registerSingleton<StorageService>(
  "StorageService",
  ClaudinaryService,
);

const mpCredentials = readMercadoPagoCredentials();
container.registerInstance<PaymentGateway>("PaymentGateway", new MercadoPagoGateway(mpCredentials.accessToken, mpCredentials.webhookSecret));

// ─── Google auth ─────────────────────────────────────────────────────────────
import { IGoogleAuthenticator } from "@domain/services/IGoogleAuthenticator";
import { GoogleOAuthAuthenticator } from "@infrastructure/security/GoogleOAuthAuthenticator";
import { IGoogleAccountLinker } from "@domain/repositories/IGoogleAccountLinker";

container.registerInstance<IGoogleAuthenticator>(
  "GoogleAuthenticator",
  new GoogleOAuthAuthenticator(googleClientId, googleClientSecret),
);
container.registerSingleton<IGoogleAccountLinker>(
  "GoogleAccountLinker",
  PrismaUserRepository,
);

// ─── Use Cases ─────────────────────────────────────────────────────────────────
// Auth
import { LoginUserUseCase } from "@application/usecase/login-user/login-user.usecase";
import { LoginWithGoogleUseCase } from "@application/usecase/login-with-google/login-with-google.usecase";
import { LogoutUserUseCase } from "@application/usecase/logout-user/logout-user.usecase";
import { RefreshAccessTokenUseCase } from "@application/usecase/refresh-access-token/refresh-access-token.usecase";
import { RegisterUserUseCase } from "@application/usecase/register-user/register-user.usecase";
import { VerifyEmailUseCase } from "@application/usecase/verify-email/verify-email.usecase";
import { RequestPasswordResetUseCase } from "@application/usecase/request-password-reset/request-password-reset.usecase";
import { ResetPasswordUseCase } from "@application/usecase/reset-password/reset-password.usecase";

container.registerSingleton("LoginUserUseCase", LoginUserUseCase);
container.registerSingleton("LoginWithGoogleUseCase", LoginWithGoogleUseCase);
container.registerSingleton("LogoutUserUseCase", LogoutUserUseCase);
container.registerSingleton(
  "RefreshAccessTokenUseCase",
  RefreshAccessTokenUseCase,
);
container.registerSingleton("RegisterUserUseCase", RegisterUserUseCase);
container.registerSingleton("VerifyEmailUseCase", VerifyEmailUseCase);
container.registerSingleton(
  "RequestPasswordResetUseCase",
  RequestPasswordResetUseCase,
);
container.registerSingleton("ResetPasswordUseCase", ResetPasswordUseCase);

// User / Profile
import { GetProfileUseCase } from "@application/usecase/get-profile/get-profile.usecase";
import { GetPublicProfileUseCase } from "@application/usecase/get-public-profile/get-public-profile.usecase";
import { UpdateProfileUseCase } from "@application/usecase/update-profile/update-profile.usecase";
import { GetNotificationPreferencesUseCase } from "@application/usecase/get-notification-preferences/get-notification-preferences.usecase";
import { UpdateNotificationPreferencesUseCase } from "@application/usecase/update-notification-preferences/update-notification-preferences.usecase";
import { AwardUserExpUseCase } from "@application/usecase/award-user-exp/award-user-exp.usecase";
import { GetUserExperienceUseCase } from "@application/usecase/get-user-experience/get-user-experience.usecase";

container.registerSingleton("GetProfileUseCase", GetProfileUseCase);
container.registerSingleton("GetPublicProfileUseCase", GetPublicProfileUseCase);
container.registerSingleton("UpdateProfileUseCase", UpdateProfileUseCase);
container.registerSingleton(
  "GetNotificationPreferencesUseCase",
  GetNotificationPreferencesUseCase,
);
container.registerSingleton(
  "UpdateNotificationPreferencesUseCase",
  UpdateNotificationPreferencesUseCase,
);
container.registerSingleton("AwardUserExpUseCase", AwardUserExpUseCase);
container.registerSingleton("GetUserExperienceUseCase", GetUserExperienceUseCase);

import { UpsertUserReviewUseCase } from "@application/usecase/user-review/upsert-user-review.usecase";
import { ListUserReviewsUseCase } from "@application/usecase/user-review/list-user-reviews.usecase";
import { ListPublicUserReviewsUseCase } from "@application/usecase/user-review/list-public-user-reviews.usecase";
import { GetUserRatingUseCase } from "@application/usecase/user-review/get-user-rating.usecase";

container.registerSingleton("UpsertUserReviewUseCase", UpsertUserReviewUseCase);
container.registerSingleton("ListUserReviewsUseCase", ListUserReviewsUseCase);
container.registerSingleton( "ListPublicUserReviewsUseCase",  ListPublicUserReviewsUseCase,);
container.registerSingleton("GetUserRatingUseCase", GetUserRatingUseCase);

// Device tokens / Push
import { RegisterDeviceTokenUseCase } from "@application/usecase/register-device-token/register-device-token.usecase";
import { RemoveDeviceTokenUseCase } from "@application/usecase/remove-device-token/remove-device-token.usecase";
import { SendPushToUserUseCase } from "@application/usecase/send-push-to-user/send-push-to-user.usecase";

container.registerSingleton(
  "RegisterDeviceTokenUseCase",
  RegisterDeviceTokenUseCase,
);
container.registerSingleton(
  "RemoveDeviceTokenUseCase",
  RemoveDeviceTokenUseCase,
);
container.registerSingleton("SendPushToUserUseCase", SendPushToUserUseCase);

// Conversations
import { CreateConversationUseCase } from "@application/usecase/conversation-usecase/create-conversation.usecase";
import { GetConversationUseCase } from "@application/usecase/conversation-usecase/get-conversation.usecase";
import { ListMyConversationsUseCase } from "@application/usecase/conversation-usecase/list-my-conversations.usecase";

container.registerSingleton(
  "CreateConversationUseCase",
  CreateConversationUseCase,
);
container.registerSingleton("GetConversationUseCase", GetConversationUseCase);
container.registerSingleton(
  "ListConversationUseCase",
  ListMyConversationsUseCase,
);

// Messages
import { SendMessageUseCase } from "@application/usecase/message-usecase/send-message.usecase";
import { ReadMessageUseCase } from "@application/usecase/message-usecase/read-message.usecase";

container.registerSingleton("SendMessageUseCase", SendMessageUseCase);
container.registerSingleton("ReadMessageUseCase", ReadMessageUseCase);

// Match
import { GetMatchResultsUseCase } from "@application/usecase/match-results-usecase/get-match-results.usecase";
import { GetUserMatchNotificationsUseCase } from "@application/usecase/match-results-usecase/get-user-match-notifications.usecase";

container.registerSingleton("GetMatchResultsUseCase", GetMatchResultsUseCase);
container.registerSingleton(
  "GetUserMatchNotificationsUseCase",
  GetUserMatchNotificationsUseCase,
);

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
import { GetReportForModerationUseCase } from "@application/usecase/report-usecase/get-report-for-moderation.usecase";
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
container.registerSingleton(
  "GetReportForModerationUseCase",
  GetReportForModerationUseCase,
);
container.registerSingleton(
  "GetFilteredReportsUseCase",
  GetFilteredReportsUseCase,
);
container.registerSingleton("ListUserReportsUseCase", ListUserReportsUseCase);
container.registerSingleton(
  "ListReportsByUserUseCase",
  ListReportsByUserUseCase,
);
container.registerSingleton("UpdateReportUseCase", UpdateReportUseCase);
container.registerSingleton("UpdateStatusUseCase", UpdateStatus);
container.registerSingleton("FollowReportUseCase", FollowReportUseCase);
container.registerSingleton("UnfollowReportUseCase", UnfollowReportUseCase);
container.registerSingleton(
  "IsFollowingReportUseCase",
  IsFollowingReportUseCase,
);
container.registerSingleton(
  "NotifyReportFollowersOfStatusChangeUseCase",
  NotifyReportFollowersOfStatusChangeUseCase,
);

// Payments
import { CreateFeaturedPreferenceUseCase } from "@application/usecase/payment-usecase/create-featured-preference.usecase";
import { ProcessPaymentWebhookUseCase } from "@application/usecase/payment-usecase/process-payment-webhook.usecase";
import { NotifyFeaturedPaymentUseCase } from "@application/usecase/notify-featured-payment/notify-featured-payment.usecase";

container.registerSingleton("CreateFeaturedPreferenceUseCase", CreateFeaturedPreferenceUseCase);
container.registerSingleton("NotifyFeaturedPaymentUseCase", NotifyFeaturedPaymentUseCase);
container.registerSingleton("ProcessPaymentWebhookUseCase", ProcessPaymentWebhookUseCase);

// Content reports (moderation)
import { CreateContentReportUseCase } from "@application/usecase/content-report-usecase/create-content-report.usecase";
import { GetContentReportQueueUseCase } from "@application/usecase/content-report-usecase/get-content-report-queue.usecase";
import { ResolveContentReportUseCase } from "@application/usecase/content-report-usecase/resolve-content-report.usecase";

container.registerSingleton(
  "CreateContentReportUseCase",
  CreateContentReportUseCase,
);
container.registerSingleton(
  "GetContentReportQueueUseCase",
  GetContentReportQueueUseCase,
);
container.registerSingleton(
  "ResolveContentReportUseCase",
  ResolveContentReportUseCase,
);

// Admin stats
import { GetAdminStatsUseCase } from "@application/usecase/stats-usecase/get-admin-stats.usecase";

container.registerSingleton("GetAdminStatsUseCase", GetAdminStatsUseCase);

// Appeals
import { CreateAppealUseCase } from "@application/usecase/appeal-usecase/create-appeal.usecase";
import { GetAppealQueueUseCase } from "@application/usecase/appeal-usecase/get-appeal-queue.usecase";
import { ResolveAppealUseCase } from "@application/usecase/appeal-usecase/resolve-appeal.usecase";
import { NotifyAppealResultUseCase } from "@application/usecase/notify-appeal-result/notify-appeal-result.usecase";

container.registerSingleton("CreateAppealUseCase", CreateAppealUseCase);
container.registerSingleton("GetAppealQueueUseCase", GetAppealQueueUseCase);
container.registerSingleton("ResolveAppealUseCase", ResolveAppealUseCase);
container.registerSingleton(
  "NotifyAppealResultUseCase",
  NotifyAppealResultUseCase,
);

// Notifications (push + email)
import { NotifyNearbyLostOwnersUseCase } from "@application/usecase/notify-nearby-lost-owners/notify-nearby-lost-owners.usecase";
import { NotifyOwnerOfMatchUseCase } from "@application/usecase/notify-owner-of-match/notify-owner-of-match.usecase";
import { NotifyOwnerOfContentSentenceUseCase } from "@application/usecase/notify-owner-of-content-sentence/notify-owner-of-content-sentence.usecase";

container.registerSingleton(
  "NotifyNearbyLostOwnersUseCase",
  NotifyNearbyLostOwnersUseCase,
);
container.registerSingleton(
  "NotifyOwnerOfMatchUseCase",
  NotifyOwnerOfMatchUseCase,
);
container.registerSingleton(
  "NotifyOwnerOfContentSentenceUseCase",
  NotifyOwnerOfContentSentenceUseCase,
);

// Catalog
import { GetBreedsUseCase } from "@application/usecase/catalog/get-breeds.usecase";
import { GetColorsUseCase } from "@application/usecase/catalog/get-colors.usecase";

container.registerSingleton("GetBreedsUseCase", GetBreedsUseCase);
container.registerSingleton("GetColorsUseCase", GetColorsUseCase);

// Missions
import { MissionRepository } from "@domain/mission/repositories/mission.repository";
import { PrismaMissionRepository } from "@infrastructure/repository/mission/mission.repository";
container.registerSingleton<MissionRepository>(
  "MissionRepository",
  PrismaMissionRepository
);

import { MissionCoverageRepository } from "@domain/mission/repositories/mission-coverage.repository";
import { PrismaMissionCoverageRepository } from "@infrastructure/repository/mission/mission-coverage.repository";
container.registerSingleton<MissionCoverageRepository>(
  "MissionCoverageRepository",
  PrismaMissionCoverageRepository
);

import { CreateMissionUseCase } from "@application/usecase/mission-usecase/create-mission.usecase";
import { GetMissionsUseCase } from "@application/usecase/mission-usecase/get-missions.usecase";
import { GetMissionDetailUseCase } from "@application/usecase/mission-usecase/get-mission-detail.usecase";
import { JoinMissionUseCase } from "@application/usecase/mission-usecase/join-mission.usecase";
import { LeaveMissionUseCase } from "@application/usecase/mission-usecase/leave-mission.usecase";
import { CancelMissionUseCase } from "@application/usecase/mission-usecase/cancel-mission.usecase";
import { RemoveVolunteerFromMissionUseCase } from "@application/usecase/mission-usecase/remove-volunteer-from-mission.usecase";
import { GetJoinedMissionsUseCase } from "@application/usecase/mission-usecase/get-joined-missions.usecase";
import { GetJoinedMissionsController } from "@presentation/controller/mission/get-joined-missions.controller";
import { UpdateMissionUseCase } from "@application/usecase/mission-usecase/update-mission.usecase";
import { AddMissionCoverageUseCase } from "@application/usecase/mission-usecase/add-mission-coverage.usecase";
import { GetMissionCoverageUseCase } from "@application/usecase/mission-usecase/get-mission-coverage.usecase";

container.registerSingleton("CreateMissionUseCase", CreateMissionUseCase);
container.registerSingleton("GetMissionsUseCase", GetMissionsUseCase);
container.registerSingleton("GetMissionDetailUseCase", GetMissionDetailUseCase);
container.registerSingleton("JoinMissionUseCase", JoinMissionUseCase);
container.registerSingleton("LeaveMissionUseCase", LeaveMissionUseCase);
container.registerSingleton("CancelMissionUseCase", CancelMissionUseCase);
container.registerSingleton("GetJoinedMissionsUseCase", GetJoinedMissionsUseCase);
container.registerSingleton("UpdateMissionUseCase", UpdateMissionUseCase);
container.registerSingleton("AddMissionCoverageUseCase", AddMissionCoverageUseCase);
container.registerSingleton("GetMissionCoverageUseCase", GetMissionCoverageUseCase);
container.registerSingleton("RemoveVolunteerFromMissionUseCase", RemoveVolunteerFromMissionUseCase);
container.registerSingleton(GetJoinedMissionsController);



import { PrismaMissionUpdateRepository } from "@infrastructure/repository/mission/mission-update.repository";
container.registerSingleton(
  "MissionUpdateRepository",
  PrismaMissionUpdateRepository
);

import { CreateMissionUpdateUseCase } from "@application/usecase/mission-usecase/create-mission-update.usecase";
container.registerSingleton(
  "CreateMissionUpdateUseCase",
  CreateMissionUpdateUseCase
);

import { CreateMissionUpdateController } from "@presentation/controller/mission/create-mission-update.controller";
container.registerSingleton(
  CreateMissionUpdateController
);

import { GetMissionUpdatesUseCase } from "@application/usecase/mission-usecase/get-mission-updates.usecase";
container.registerSingleton(
  "GetMissionUpdatesUseCase",
  GetMissionUpdatesUseCase
);

import { GetMissionUpdatesController } from "@presentation/controller/mission/get-mission-updates.controller";
container.registerSingleton(
  GetMissionUpdatesController
);

import { ScoreMissionUpdateUseCase } from "@application/usecase/mission-usecase/score-mission-update.usecase";
container.registerSingleton(
  "ScoreMissionUpdateUseCase",
  ScoreMissionUpdateUseCase
);

import { GetCommentPointValuesUseCase } from "@application/usecase/mission-usecase/get-comment-point-values.usecase";
container.registerSingleton(
  "GetCommentPointValuesUseCase",
  GetCommentPointValuesUseCase
);

import { ScoreMissionUpdateController } from "@presentation/controller/mission/score-mission-update.controller";
container.registerSingleton(
  ScoreMissionUpdateController
);

import { GetCommentPointValuesController } from "@presentation/controller/mission/get-comment-point-values.controller";
container.registerSingleton(
  GetCommentPointValuesController
);

