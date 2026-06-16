import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetMyConversationUseCase } from "../get-my-conversation.usecase";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
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

const makeConv = (id: number, pub: string, u1: number, u2: number): Conversation =>
  Conversation.create({ conversationId: id, publicId: pub, userOneId: u1, userTwoId: u2, createdAt: new Date() });

const makeMsg = (conversationId: number): Message =>
  Message.create({ messageId: 1, publicId: "msg-uuid", senderUserId: 10, receiverId: 20, conversationId, text: MessageText.create("Hola"), isRead: false, createdAt: new Date() });

describe("GetMyConversationUseCase", () => {
  let userRepo: IUserRepository;
  let convRepo: ConversationRepository;
  let msgRepo: MessageRepository;
  let useCase: GetMyConversationUseCase;

  beforeEach(() => {
    userRepo = { save: vi.fn(), findByEmail: vi.fn(), markVerified: vi.fn(), findByPublicId: vi.fn(), findById: vi.fn(), findByIds: vi.fn(), updateProfile: vi.fn(), updatePassword: vi.fn() };
    convRepo = { findAllByUserId: vi.fn(), findByPublicId: vi.fn(), findByParticipants: vi.fn(), findById: vi.fn(), save: vi.fn(), delete: vi.fn() };
    msgRepo = { findById: vi.fn(), findByPublicId: vi.fn(), findByConversationId: vi.fn(), findLastMessageByConversationIds: vi.fn(), findUnreadByUserId: vi.fn(), countUnreadByConversationId: vi.fn(), save: vi.fn(), markAsRead: vi.fn(), delete: vi.fn() };
    useCase = new GetMyConversationUseCase(userRepo, convRepo, msgRepo);
  });

  it("lanza UserNotFoundError cuando el usuario no existe", async () => {
    vi.mocked(userRepo.findByPublicId).mockResolvedValue(null);
    await expect(useCase.execute("non-existent")).rejects.toThrow(UserNotFoundError);
  });

  it("retorna array vacío cuando el usuario no tiene conversaciones", async () => {
    vi.mocked(userRepo.findByPublicId).mockResolvedValue(makeUser(10, "u"));
    vi.mocked(convRepo.findAllByUserId).mockResolvedValue([]);
    vi.mocked(msgRepo.findLastMessageByConversationIds).mockResolvedValue([]);
    vi.mocked(userRepo.findByIds).mockResolvedValue([]);

    const result = await useCase.execute("u");
    expect(result).toEqual([]);
  });

  it("retorna resúmenes de conversaciones con último mensaje", async () => {
    const user = makeUser(10, "user-uuid");
    const conv = makeConv(1, "conv-uuid", 10, 20);

    vi.mocked(userRepo.findByPublicId).mockResolvedValue(user);
    vi.mocked(convRepo.findAllByUserId).mockResolvedValue([conv]);
    vi.mocked(msgRepo.findLastMessageByConversationIds).mockResolvedValue([makeMsg(1)]);
    vi.mocked(userRepo.findByIds).mockResolvedValue([
      { user_id: 20, public_id: "other-uuid", username: "otherUser", photoUrl: "photo.jpg" },
    ]);

    const result = await useCase.execute("user-uuid");

    expect(result).toHaveLength(1);
    expect(result[0]?.publicId).toBe("conv-uuid");
    expect(result[0]?.otherUser.username).toBe("otherUser");
    expect(result[0]?.lastMessage?.text).toBe("Hola");
  });

  it("retorna lastMessage null cuando la conversación no tiene mensajes", async () => {
    const user = makeUser(10, "user-uuid");
    const conv = makeConv(1, "conv-uuid", 10, 20);

    vi.mocked(userRepo.findByPublicId).mockResolvedValue(user);
    vi.mocked(convRepo.findAllByUserId).mockResolvedValue([conv]);
    vi.mocked(msgRepo.findLastMessageByConversationIds).mockResolvedValue([]);
    vi.mocked(userRepo.findByIds).mockResolvedValue([
      { user_id: 20, public_id: "other-uuid", username: "otherUser", photoUrl: null },
    ]);

    const result = await useCase.execute("user-uuid");

    expect(result[0]?.lastMessage).toBeNull();
  });

  it("lanza UserNotFoundError cuando el otro participante no existe", async () => {
    const user = makeUser(10, "user-uuid");
    const conv = makeConv(1, "conv-uuid", 10, 20);

    vi.mocked(userRepo.findByPublicId).mockResolvedValue(user);
    vi.mocked(convRepo.findAllByUserId).mockResolvedValue([conv]);
    vi.mocked(msgRepo.findLastMessageByConversationIds).mockResolvedValue([]);
    vi.mocked(userRepo.findByIds).mockResolvedValue([]);

    await expect(useCase.execute("user-uuid")).rejects.toThrow(UserNotFoundError);
  });
});
