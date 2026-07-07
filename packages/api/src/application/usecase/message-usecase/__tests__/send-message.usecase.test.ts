import { describe, it, expect, vi, beforeEach } from "vitest";
import { SendMessageUseCase } from "../send-message.usecase";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { ConversationNotFoundError } from "@domain/errors/ConversationNotFoundError";
import { UnauthorizedConversationError } from "@domain/errors/UnauthorizedConversationError";
import { InvalidMessageTextError } from "@domain/errors/InvalidMessageTextError";
import { ConversationSuspendedError } from "@domain/errors/ConversationSuspendedError";
import { Conversation } from "@domain/conversation/Conversation";
import { User } from "@domain/entities/User";
import type { ConversationRepository } from "@domain/conversation/repositories/conversation.repository";
import type { MessageRepository } from "@domain/message/repositories/message.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { StorageService } from "@application/ports/StorageService";

const HASH = "$2b$12$abcdefghijklmnopqrstuv.wxyzabcdefghijklmnopqrstuvwxyz12";

const makeUser = (id: number, pub: string): User =>
  User.reconstruct(id, pub, "t@t.com", "user", HASH, true, new Date(), null, null, null);

const makeConv = (u1: number, u2: number): Conversation =>
  Conversation.create({ conversationId: 1, publicId: "conv-uuid", userOneId: u1, userTwoId: u2, createdAt: new Date() });

describe("SendMessageUseCase", () => {
  let convRepo: ConversationRepository;
  let msgRepo: MessageRepository;
  let userRepo: IUserRepository;
  let storageService: StorageService;
  let useCase: SendMessageUseCase;

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
    storageService = { upload: vi.fn(), delete: vi.fn() };
    useCase = new SendMessageUseCase(convRepo, msgRepo, userRepo, storageService);
  });

  it("envía un mensaje y retorna MessageOutput", async () => {
    const sender = makeUser(10, "sender-uuid");
    const receiver = makeUser(20, "receiver-uuid");
    const conv = makeConv(10, 20);

    vi.mocked(userRepo.findByPublicId).mockResolvedValue(sender);
    vi.mocked(convRepo.findByPublicId).mockResolvedValue(conv);
    vi.mocked(userRepo.findById).mockResolvedValue(receiver);
    vi.mocked(msgRepo.save).mockImplementation(async (msg) => msg);

    const result = await useCase.execute({
      publicUserId: "sender-uuid",
      publicConversationId: "conv-uuid",
      text: "Vi a tu perro",
    });

    expect(result.text).toBe("Vi a tu perro");
    expect(result.senderId).toBe("sender-uuid");
    expect(result.receiverId).toBe("receiver-uuid");
    expect(result.isRead).toBe(false);
    expect(result.publicId).toBeDefined();
    expect(result.images).toEqual([]);
    expect(msgRepo.save).toHaveBeenCalledOnce();
  });

  it("envía un mensaje con imágenes con éxito", async () => {
    const sender = makeUser(10, "sender-uuid");
    const receiver = makeUser(20, "receiver-uuid");
    const conv = makeConv(10, 20);

    vi.mocked(userRepo.findByPublicId).mockResolvedValue(sender);
    vi.mocked(convRepo.findByPublicId).mockResolvedValue(conv);
    vi.mocked(userRepo.findById).mockResolvedValue(receiver);
    vi.mocked(storageService.upload).mockResolvedValue({ url: "https://example.com/uploaded.jpg", publicId: "uploaded-pub-id" });
    vi.mocked(msgRepo.save).mockImplementation(async (msg) => msg);

    const buffer = Buffer.from("fake-image");
    const result = await useCase.execute({
      publicUserId: "sender-uuid",
      publicConversationId: "conv-uuid",
      text: "",
      images: [buffer],
    });

    expect(result.text).toBe("");
    expect(result.images).toHaveLength(1);
    expect(result.images[0]!.url).toBe("https://example.com/uploaded.jpg");
    expect(storageService.upload).toHaveBeenCalledWith(buffer, "messages");
    expect(msgRepo.save).toHaveBeenCalledOnce();
  });

  it("lanza UserNotFoundError cuando el remitente no existe", async () => {
    vi.mocked(userRepo.findByPublicId).mockResolvedValue(null);
    await expect(useCase.execute({ publicUserId: "x", publicConversationId: "y", text: "hi" })).rejects.toThrow(UserNotFoundError);
    expect(msgRepo.save).not.toHaveBeenCalled();
  });

  it("lanza ConversationNotFoundError cuando la conversación no existe", async () => {
    vi.mocked(userRepo.findByPublicId).mockResolvedValue(makeUser(10, "u"));
    vi.mocked(convRepo.findByPublicId).mockResolvedValue(null);
    await expect(useCase.execute({ publicUserId: "u", publicConversationId: "x", text: "hi" })).rejects.toThrow(ConversationNotFoundError);
    expect(msgRepo.save).not.toHaveBeenCalled();
  });

  it("lanza UnauthorizedConversationError cuando el usuario no es participante", async () => {
    vi.mocked(userRepo.findByPublicId).mockResolvedValue(makeUser(99, "u"));
    vi.mocked(convRepo.findByPublicId).mockResolvedValue(makeConv(10, 20));
    await expect(useCase.execute({ publicUserId: "u", publicConversationId: "conv-uuid", text: "hi" })).rejects.toThrow(UnauthorizedConversationError);
    expect(msgRepo.save).not.toHaveBeenCalled();
  });

  it("lanza ConversationSuspendedError cuando la conversación está suspendida", async () => {
    const sender = makeUser(10, "sender-uuid");
    const suspendedConv = Conversation.create({ conversationId: 1, publicId: "conv-uuid", userOneId: 10, userTwoId: 20, createdAt: new Date(), isSuspended: true });
    vi.mocked(userRepo.findByPublicId).mockResolvedValue(sender);
    vi.mocked(convRepo.findByPublicId).mockResolvedValue(suspendedConv);

    await expect(
      useCase.execute({ publicUserId: "sender-uuid", publicConversationId: "conv-uuid", text: "hola" })
    ).rejects.toThrow(ConversationSuspendedError);
    expect(msgRepo.save).not.toHaveBeenCalled();
  });

  it("lanza UserNotFoundError cuando el receptor no existe", async () => {
    vi.mocked(userRepo.findByPublicId).mockResolvedValue(makeUser(10, "u"));
    vi.mocked(convRepo.findByPublicId).mockResolvedValue(makeConv(10, 20));
    vi.mocked(userRepo.findById).mockResolvedValue(null);
    await expect(useCase.execute({ publicUserId: "u", publicConversationId: "conv-uuid", text: "hi" })).rejects.toThrow(UserNotFoundError);
    expect(msgRepo.save).not.toHaveBeenCalled();
  });

  it("lanza error de validación para texto de mensaje inválido (número de teléfono)", async () => {
    const sender = makeUser(10, "sender-uuid");
    const receiver = makeUser(20, "receiver-uuid");
    vi.mocked(userRepo.findByPublicId).mockResolvedValue(sender);
    vi.mocked(convRepo.findByPublicId).mockResolvedValue(makeConv(10, 20));
    vi.mocked(userRepo.findById).mockResolvedValue(receiver);

    await expect(
      useCase.execute({ publicUserId: "sender-uuid", publicConversationId: "conv-uuid", text: "Llamame al +54 11 1234 5678" })
    ).rejects.toThrow(InvalidMessageTextError);
    expect(msgRepo.save).not.toHaveBeenCalled();
  });
});
