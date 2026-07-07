import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReadMessageUseCase } from "../read-message.usecase";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { ConversationNotFoundError } from "@domain/errors/ConversationNotFoundError";
import { UnauthorizedConversationError } from "@domain/errors/UnauthorizedConversationError";
import { Conversation } from "@domain/conversation/Conversation";
import { User } from "@domain/entities/User";
import type { ConversationRepository } from "@domain/conversation/repositories/conversation.repository";
import type { MessageRepository } from "@domain/message/repositories/message.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";

const HASH = "$2b$12$abcdefghijklmnopqrstuv.wxyzabcdefghijklmnopqrstuvwxyz12";

const makeUser = (id: number, pub: string): User =>
  User.reconstruct(id, pub, "t@t.com", "user", HASH, true, new Date(), null, null, null);

const makeConv = (u1: number, u2: number): Conversation =>
  Conversation.create({ conversationId: 1, publicId: "conv-uuid", userOneId: u1, userTwoId: u2, createdAt: new Date() });

describe("ReadMessageUseCase", () => {
  let convRepo: ConversationRepository;
  let msgRepo: MessageRepository;
  let userRepo: IUserRepository;
  let useCase: ReadMessageUseCase;

  beforeEach(() => {
    convRepo = { findAllByUserId: vi.fn(), findByPublicId: vi.fn(), findByParticipants: vi.fn(), findById: vi.fn(), save: vi.fn(), update: vi.fn(), delete: vi.fn() };
    msgRepo = { findById: vi.fn(), findByPublicId: vi.fn(), findByConversationId: vi.fn(), findLastMessageByConversationIds: vi.fn(), findUnreadByUserId: vi.fn(), countUnreadByConversationId: vi.fn(), save: vi.fn(), markAsRead: vi.fn(), delete: vi.fn() };
    userRepo = {
      save: vi.fn(), findByEmail: vi.fn(), findRoleByPublicId: vi.fn(), markVerified: vi.fn(), markSuspended: vi.fn(), unsuspend: vi.fn(), findByPublicId: vi.fn(), findByIds: vi.fn(), findById: vi.fn(), updateProfile: vi.fn(), updatePassword: vi.fn(), deleteById: vi.fn(), getProfileStatsByPublicId: vi.fn().mockResolvedValue({
        reportsCreated: 0,
        successfulReturns: 0,
        activeDays: 1,
        petsHelped: 0,
      }),
    };
    useCase = new ReadMessageUseCase(convRepo, msgRepo, userRepo);
  });

  it("marca los mensajes como leídos con éxito y devuelve el ID del otro participante", async () => {
    const user = makeUser(10, "user-uuid");
    const otherUser = makeUser(20, "other-uuid");
    const conv = makeConv(10, 20);

    vi.mocked(convRepo.findByPublicId).mockResolvedValue(conv);
    vi.mocked(userRepo.findByPublicId).mockResolvedValue(user);
    vi.mocked(userRepo.findById).mockResolvedValue(otherUser);
    vi.mocked(msgRepo.markAsRead).mockResolvedValue(undefined);

    const result = await useCase.execute("conv-uuid", "user-uuid");

    expect(result).toBe("other-uuid");
    expect(convRepo.findByPublicId).toHaveBeenCalledWith("conv-uuid");
    expect(userRepo.findByPublicId).toHaveBeenCalledWith("user-uuid");
    expect(userRepo.findById).toHaveBeenCalledWith(20);
    expect(msgRepo.markAsRead).toHaveBeenCalledWith(1, 10);
  });

  it("lanza ConversationNotFoundError cuando la conversación no existe o no tiene id", async () => {
    vi.mocked(convRepo.findByPublicId).mockResolvedValue(null);

    await expect(useCase.execute("non-existent", "user-uuid")).rejects.toThrow(ConversationNotFoundError);
    expect(msgRepo.markAsRead).not.toHaveBeenCalled();
  });

  it("lanza UserNotFoundError cuando el usuario no existe", async () => {
    const conv = makeConv(10, 20);
    vi.mocked(convRepo.findByPublicId).mockResolvedValue(conv);
    vi.mocked(userRepo.findByPublicId).mockResolvedValue(null);

    await expect(useCase.execute("conv-uuid", "non-existent")).rejects.toThrow(UserNotFoundError);
    expect(msgRepo.markAsRead).not.toHaveBeenCalled();
  });

  it("lanza UnauthorizedConversationError cuando el usuario no pertenece a la conversación", async () => {
    const user = makeUser(99, "user-uuid");
    const conv = makeConv(10, 20);

    vi.mocked(convRepo.findByPublicId).mockResolvedValue(conv);
    vi.mocked(userRepo.findByPublicId).mockResolvedValue(user);

    await expect(useCase.execute("conv-uuid", "user-uuid")).rejects.toThrow(UnauthorizedConversationError);
    expect(msgRepo.markAsRead).not.toHaveBeenCalled();
  });
});
