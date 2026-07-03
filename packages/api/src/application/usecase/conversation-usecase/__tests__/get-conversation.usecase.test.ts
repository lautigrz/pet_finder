import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetConversationUseCase } from "../get-conversation.usecase";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { ConversationNotFoundError } from "@domain/errors/ConversationNotFoundError";
import { UnauthorizedConversationError } from "@domain/errors/UnauthorizedConversationError";
import { Conversation } from "@domain/conversation/Conversation";
import { Message } from "@domain/message/aggregate/MessageAgregate";
import { MessageText } from "@domain/message/value-objects/message.vo";
import { User } from "@domain/entities/User";
import type { ConversationRepository } from "@domain/conversation/repositories/conversation.repository";
import type { MessageRepository } from "@domain/message/repositories/message.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";

const HASH = "$2b$12$abcdefghijklmnopqrstuv.wxyzabcdefghijklmnopqrstuvwxyz12";

const makeUser = (id: number, pub: string, name = "user"): User =>
  User.reconstruct(id, pub, "t@t.com", name, HASH, true, new Date(), null, null, "photo.jpg");

const makeConv = (u1: number, u2: number): Conversation =>
  Conversation.create({ conversationId: 1, publicId: "conv-uuid", userOneId: u1, userTwoId: u2, createdAt: new Date() });

const makeMsg = (sender: number, receiver: number): Message =>
  Message.create({ messageId: 1, publicId: "msg-uuid", senderUserId: sender, receiverId: receiver, conversationId: 1, text: MessageText.create("Hola"), isRead: false, createdAt: new Date(), images: [] });

describe("GetConversationUseCase", () => {
  let convRepo: ConversationRepository;
  let msgRepo: MessageRepository;
  let userRepo: IUserRepository;
  let useCase: GetConversationUseCase;

  beforeEach(() => {
    convRepo = { findAllByUserId: vi.fn(), findByPublicId: vi.fn(), findByParticipants: vi.fn(), findById: vi.fn(), save: vi.fn(), update: vi.fn(), delete: vi.fn() };
    msgRepo = { findById: vi.fn(), findByPublicId: vi.fn(), findByConversationId: vi.fn(), findLastMessageByConversationIds: vi.fn(), findUnreadByUserId: vi.fn(), countUnreadByConversationId: vi.fn(), save: vi.fn(), markAsRead: vi.fn(), delete: vi.fn() };
    userRepo = { save: vi.fn(), findByEmail: vi.fn(), findRoleByPublicId: vi.fn(), markVerified: vi.fn(), markSuspended: vi.fn(), findByPublicId: vi.fn(), findByIds: vi.fn(), findById: vi.fn(), updateProfile: vi.fn(), updatePassword: vi.fn(), deleteById: vi.fn() };
    useCase = new GetConversationUseCase(convRepo, msgRepo, userRepo);
  });

  it("retorna la conversación con mensajes e info del otro usuario", async () => {
    const cur = makeUser(10, "user-uuid", "cur");
    const other = makeUser(20, "other-uuid", "other");
    vi.mocked(userRepo.findByPublicId).mockResolvedValue(cur);
    vi.mocked(convRepo.findByPublicId).mockResolvedValue(makeConv(10, 20));
    vi.mocked(userRepo.findById).mockResolvedValue(other);
    vi.mocked(msgRepo.findByConversationId).mockResolvedValue({ items: [makeMsg(10, 20)], total: 1 });

    const result = await useCase.execute({ publicUserId: "user-uuid", publicConversationId: "conv-uuid" });

    expect(result.publicId).toBe("conv-uuid");
    expect(result.otherUser.username).toBe("other");
    expect(result.messages).toHaveLength(1);
  });

  it("lanza UserNotFoundError cuando el usuario no existe", async () => {
    vi.mocked(userRepo.findByPublicId).mockResolvedValue(null);
    await expect(useCase.execute({ publicUserId: "x", publicConversationId: "y" })).rejects.toThrow(UserNotFoundError);
  });

  it("lanza ConversationNotFoundError cuando la conversación no existe", async () => {
    vi.mocked(userRepo.findByPublicId).mockResolvedValue(makeUser(10, "u"));
    vi.mocked(convRepo.findByPublicId).mockResolvedValue(null);
    await expect(useCase.execute({ publicUserId: "u", publicConversationId: "x" })).rejects.toThrow(ConversationNotFoundError);
  });

  it("lanza UnauthorizedConversationError cuando el usuario no es participante", async () => {
    vi.mocked(userRepo.findByPublicId).mockResolvedValue(makeUser(99, "u"));
    vi.mocked(convRepo.findByPublicId).mockResolvedValue(makeConv(10, 20));
    await expect(useCase.execute({ publicUserId: "u", publicConversationId: "conv-uuid" })).rejects.toThrow(UnauthorizedConversationError);
  });

  it("lanza UserNotFoundError cuando el otro participante no existe", async () => {
    vi.mocked(userRepo.findByPublicId).mockResolvedValue(makeUser(10, "u"));
    vi.mocked(convRepo.findByPublicId).mockResolvedValue(makeConv(10, 20));
    vi.mocked(userRepo.findById).mockResolvedValue(null);
    await expect(useCase.execute({ publicUserId: "u", publicConversationId: "conv-uuid" })).rejects.toThrow(UserNotFoundError);
  });

  it("usa valores de paginación por defecto", async () => {
    vi.mocked(userRepo.findByPublicId).mockResolvedValue(makeUser(10, "u"));
    vi.mocked(convRepo.findByPublicId).mockResolvedValue(makeConv(10, 20));
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser(20, "o"));
    vi.mocked(msgRepo.findByConversationId).mockResolvedValue({ items: [], total: 0 });

    await useCase.execute({ publicUserId: "u", publicConversationId: "conv-uuid" });
    expect(msgRepo.findByConversationId).toHaveBeenCalledWith(1, { page: 1, limit: 20, orderBy: "desc" });
  });
});
