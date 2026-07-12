import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListMyConversationsUseCase } from "../list-my-conversations.usecase";
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

const makeMsg = (conversationId: number, params: Partial<Message>): Message =>
  Message.create({
    messageId: 1, publicId: "msg-uuid", senderUserId: 10, receiverId: 20, conversationId,
    text: MessageText.create("Hola"), isRead: false, createdAt: new Date(), images: [], ...params
  });

describe("ListMyConversationsUseCase", () => {
  let userRepo: IUserRepository;
  let convRepo: ConversationRepository;
  let msgRepo: MessageRepository;
  let useCase: ListMyConversationsUseCase;

  beforeEach(() => {
    userRepo = {
      save: vi.fn(), findByEmail: vi.fn(), findRoleByPublicId: vi.fn(), markVerified: vi.fn(), markSuspended: vi.fn(), unsuspend: vi.fn(), findByPublicId: vi.fn(), findById: vi.fn(), findByIds: vi.fn(), updateProfile: vi.fn(), updatePassword: vi.fn(), deleteById: vi.fn(), getProfileStatsByPublicId: vi.fn().mockResolvedValue({
        reportsCreated: 0,
        successfulReturns: 0,
        activeDays: 1,
        petsHelped: 0,
      }),
    };
    convRepo = { findAllByUserId: vi.fn(), findByPublicId: vi.fn(), findByParticipants: vi.fn(), findById: vi.fn(), save: vi.fn(), update: vi.fn(), delete: vi.fn() };
    msgRepo = { findById: vi.fn(), findByPublicId: vi.fn(), findByConversationId: vi.fn(), findLastMessageByConversationIds: vi.fn(), findUnreadByUserId: vi.fn(), countUnreadByConversationId: vi.fn(), save: vi.fn(), markAsRead: vi.fn(), delete: vi.fn() };
    useCase = new ListMyConversationsUseCase(userRepo, convRepo, msgRepo);
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

  it("retorna las conversaciones ordenadas por la fecha del último mensaje descendente", async () => {
    const user = makeUser(10, "user-uuid");

    const conv1 = makeConv(1, "conv-1", 10, 20);
    const conv2 = makeConv(2, "conv-2", 10, 30);
    const conv3 = makeConv(3, "conv-3", 10, 40);

    vi.mocked(userRepo.findByPublicId).mockResolvedValue(user);

    vi.mocked(convRepo.findAllByUserId).mockResolvedValue([
      conv2,
      conv1,
      conv3,
    ]);

    vi.mocked(msgRepo.findLastMessageByConversationIds).mockResolvedValue([
      makeMsg(1, {
        conversationId: 1,
        text: MessageText.create("Viejo"),
        createdAt: new Date("2026-07-10T10:00:00Z"),
      }),
      makeMsg(2, {
        conversationId: 2,
        text: MessageText.create("Más reciente"),
        createdAt: new Date("2026-07-12T12:00:00Z"),
      }),
      makeMsg(3, {
        conversationId: 3,
        text: MessageText.create("Intermedio"),
        createdAt: new Date("2026-07-11T15:00:00Z"),
      }),
    ]);

    vi.mocked(userRepo.findByIds).mockResolvedValue([
      { user_id: 20, public_id: "u20", username: "user20", photoUrl: null },
      { user_id: 30, public_id: "u30", username: "user30", photoUrl: null },
      { user_id: 40, public_id: "u40", username: "user40", photoUrl: null },
    ]);

    const result = await useCase.execute("user-uuid");

    expect(result.map(c => c.publicId)).toEqual([
      "conv-2",
      "conv-3",
      "conv-1",
    ]);
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

  it("retorna 'Usuario no encontrado' cuando el otro participante no existe", async () => {
    const user = makeUser(10, "user-uuid");
    const conv = makeConv(1, "conv-uuid", 10, 20);

    vi.mocked(userRepo.findByPublicId).mockResolvedValue(user);
    vi.mocked(convRepo.findAllByUserId).mockResolvedValue([conv]);
    vi.mocked(msgRepo.findLastMessageByConversationIds).mockResolvedValue([]);
    vi.mocked(userRepo.findByIds).mockResolvedValue([]);

    const result = await useCase.execute("user-uuid");

    expect(result).toHaveLength(1);
    expect(result[0]?.otherUser.username).toBe("Usuario no encontrado");
    expect(result[0]?.otherUser.publicId).toBeNull();
  });
});
