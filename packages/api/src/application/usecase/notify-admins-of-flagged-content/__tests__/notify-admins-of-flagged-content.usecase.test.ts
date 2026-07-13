import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotifyAdminsOfFlaggedContentUseCase } from "@application/usecase/notify-admins-of-flagged-content/notify-admins-of-flagged-content.usecase";
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { IEmailService } from "@domain/services/IEmailService";
import { ContentReportTargetType } from "@domain/content-report/types/content-report-target-type";

describe("NotifyAdminsOfFlaggedContentUseCase", () => {
    let userRepository: IUserRepository;
    let emailService: IEmailService;
    let useCase: NotifyAdminsOfFlaggedContentUseCase;

    beforeEach(() => {
        userRepository = {
            findAdminEmails: vi.fn().mockResolvedValue([]),
        } as unknown as IUserRepository;

        emailService = {
            sendContentFlaggedAlert: vi.fn().mockResolvedValue(undefined),
        } as unknown as IEmailService;

        useCase = new NotifyAdminsOfFlaggedContentUseCase(userRepository, emailService);
    });

    it("manda el mail a cada admin con el tipo de contenido", async () => {
        vi.mocked(userRepository.findAdminEmails).mockResolvedValue([
            "admin1@example.com",
            "admin2@example.com",
        ]);

        await useCase.execute(ContentReportTargetType.USER);

        expect(emailService.sendContentFlaggedAlert).toHaveBeenCalledTimes(2);
        expect(emailService.sendContentFlaggedAlert).toHaveBeenCalledWith(
            "admin1@example.com",
            ContentReportTargetType.USER,
        );
        expect(emailService.sendContentFlaggedAlert).toHaveBeenCalledWith(
            "admin2@example.com",
            ContentReportTargetType.USER,
        );
    });

    it("no manda ningún mail si no hay admins", async () => {
        vi.mocked(userRepository.findAdminEmails).mockResolvedValue([]);

        await useCase.execute(ContentReportTargetType.POST);

        expect(emailService.sendContentFlaggedAlert).not.toHaveBeenCalled();
    });
});
