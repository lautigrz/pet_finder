import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateConversationUseCase } from "../create-conversation.usecase";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { ConversationAlreadyExistsError } from "@domain/errors/ConversationAlreadyExistsError";
import { InvalidConversationWithItself } from "@domain/errors/InvalidConversationWithItself";
import { Conversation } from "@domain/conversation/Conversation";
import { User } from "@domain/entities/User";
import type { ConversationRepository } from "@domain/conversation/repositories/conversation.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";

const VALID_BCRYPT_HASH = "$2b$12$abcdefghijklmnopqrstuv.wxyzabcdefghijklmnopqrstuvwxyz12";

const makeUser = (internalId: number, publicId: string): User =>
  User.reconstruct(internalId, publicId, "test@test.com", "testuser", VALID_BCRYPT_HASH, true, new Date(), null, null, null);

const makeConversation = (): Conversation =>
  Conversation.create({
    conversationId: 1,
    publicId: "conv-uuid",
    userOneId: 10,
    userTwoId: 20,
    createdAt: new Date(),
  });

describe("CreateConversationUseCase", () => {
  let conversationRepository: ConversationRepository;
  let userRepository: IUserRepository;
  let useCase: CreateConversationUseCase;

  beforeEach(() => {
    conversationRepository = {
      findAllByUserId: vi.fn(),
      findByPublicId: vi.fn(),
      findByParticipants: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    userRepository = {
      save: vi.fn(),
      findByEmail: vi.fn(), findRoleByPublicId: vi.fn(),
      markVerified: vi.fn(),
      findByPublicId: vi.fn(),
      findByIds: vi.fn(),
      findById: vi.fn(),
      updateProfile: vi.fn(),
      updatePassword: vi.fn(),
      deleteById: vi.fn(),
    };
    useCase = new CreateConversationUseCase(conversationRepository, userRepository);
  });

  it("crea una conversación y retorna publicId y createdAt", async () => {
    const requester = makeUser(10, "requester-uuid");
    const target = makeUser(20, "target-uuid");

    vi.mocked(userRepository.findByPublicId)
      .mockResolvedValueOnce(requester)
      .mockResolvedValueOnce(target);
    vi.mocked(conversationRepository.findByParticipants).mockResolvedValue(null);
    vi.mocked(conversationRepository.save).mockImplementation(async (conv) => conv);

    const result = await useCase.execute({
      publicRequesterId: "requester-uuid",
      publicTargetId: "target-uuid",
    });

    expect(result.publicId).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(conversationRepository.save).toHaveBeenCalledOnce();
  });

  it("lanza UserNotFoundError cuando el solicitante no existe", async () => {
    vi.mocked(userRepository.findByPublicId).mockResolvedValue(null);

    await expect(
      useCase.execute({
        publicRequesterId: "non-existent",
        publicTargetId: "target-uuid",
      })
    ).rejects.toThrow(UserNotFoundError);

    expect(conversationRepository.save).not.toHaveBeenCalled();
  });

  it("lanza UserNotFoundError cuando el destinatario no existe", async () => {
    const requester = makeUser(10, "requester-uuid");
    vi.mocked(userRepository.findByPublicId)
      .mockResolvedValueOnce(requester)
      .mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        publicRequesterId: "requester-uuid",
        publicTargetId: "non-existent",
      })
    ).rejects.toThrow(UserNotFoundError);

    expect(conversationRepository.save).not.toHaveBeenCalled();
  });

  it("lanza error cuando el usuario intenta crear conversación consigo mismo", async () => {
    const user = makeUser(10, "same-uuid");

    vi.mocked(userRepository.findByPublicId)
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(user);

    await expect(
      useCase.execute({
        publicRequesterId: "same-uuid",
        publicTargetId: "same-uuid",
      })
    ).rejects.toThrow(InvalidConversationWithItself);

    expect(conversationRepository.save).not.toHaveBeenCalled();
  });

  it("lanza ConversationAlreadyExistsError cuando ya existe una conversación entre los participantes", async () => {
    const requester = makeUser(10, "requester-uuid");
    const target = makeUser(20, "target-uuid");

    vi.mocked(userRepository.findByPublicId)
      .mockResolvedValueOnce(requester)
      .mockResolvedValueOnce(target);
    vi.mocked(conversationRepository.findByParticipants).mockResolvedValue(makeConversation());

    await expect(
      useCase.execute({
        publicRequesterId: "requester-uuid",
        publicTargetId: "target-uuid",
      })
    ).rejects.toThrow(ConversationAlreadyExistsError);

    expect(conversationRepository.save).not.toHaveBeenCalled();
  });
});
