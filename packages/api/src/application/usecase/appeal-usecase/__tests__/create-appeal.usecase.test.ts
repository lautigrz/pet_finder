import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateAppealUseCase } from "../create-appeal.usecase";
import { CreateAppealInput } from "../create-appeal.input";
import type { AppealRepository } from "@domain/appeal/repositories/appeal.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IAppealTokenSigner } from "@domain/services/IAppealTokenSigner";
import { AppealTargetType } from "@domain/appeal/types/appeal-target-type";
import { AlreadyAppealedError } from "@domain/appeal/errors/AlreadyAppealedError";
import { InvalidAppealTokenError } from "@domain/appeal/errors/InvalidAppealTokenError";
import { Appeal } from "@domain/appeal/Appeal";
import { User } from "@domain/entities/User";

const payload = { targetType: AppealTargetType.POST, targetPublicId: "post-uuid", appellantPublicId: "owner-uuid" };

function appellant(): User {
  return User.reconstruct(9, "owner-uuid", "owner@test.com", "owner", "x".repeat(60), true, new Date("2026-06-20"), null, null, null);
}

describe("CreateAppealUseCase", () => {
  let appealRepository: AppealRepository;
  let userRepository: IUserRepository;
  let tokenSigner: IAppealTokenSigner;
  let useCase: CreateAppealUseCase;

  beforeEach(() => {
    appealRepository = {
      save: vi.fn().mockResolvedValue(1),
      existsForTarget: vi.fn().mockResolvedValue(false),
      findByPublicId: vi.fn(),
      update: vi.fn(),
      findQueueByStatus: vi.fn(),
    } as unknown as AppealRepository;
    userRepository = { findByPublicId: vi.fn().mockResolvedValue(appellant()) } as unknown as IUserRepository;
    tokenSigner = { verify: vi.fn().mockReturnValue(payload), sign: vi.fn() };
    useCase = new CreateAppealUseCase(appealRepository, userRepository, tokenSigner);
  });

  it("crea la apelación con el caso del token y el mensaje", async () => {
    await useCase.execute(new CreateAppealInput("tok", "Mi defensa"));

    expect(appealRepository.existsForTarget).toHaveBeenCalledWith(AppealTargetType.POST, "post-uuid");
    expect(appealRepository.save).toHaveBeenCalledOnce();
    const saved = vi.mocked(appealRepository.save).mock.calls[0]![0] as Appeal;
    expect(saved.appellantUserId).toBe(9);
    expect(saved.targetType).toBe(AppealTargetType.POST);
    expect(saved.targetPublicId).toBe("post-uuid");
    expect(saved.message).toBe("Mi defensa");
  });

  it("lanza InvalidAppealTokenError si el token no es válido", async () => {
    vi.mocked(tokenSigner.verify).mockImplementation(() => { throw new InvalidAppealTokenError(); });

    await expect(useCase.execute(new CreateAppealInput("bad", "x"))).rejects.toThrow(InvalidAppealTokenError);
    expect(appealRepository.save).not.toHaveBeenCalled();
  });

  it("lanza AlreadyAppealedError si el caso ya fue apelado", async () => {
    vi.mocked(appealRepository.existsForTarget).mockResolvedValue(true);

    await expect(useCase.execute(new CreateAppealInput("tok", "x"))).rejects.toThrow(AlreadyAppealedError);
    expect(appealRepository.save).not.toHaveBeenCalled();
  });

  it("lanza InvalidAppealTokenError si el apelante del token no existe", async () => {
    vi.mocked(userRepository.findByPublicId).mockResolvedValue(null);

    await expect(useCase.execute(new CreateAppealInput("tok", "x"))).rejects.toThrow(InvalidAppealTokenError);
    expect(appealRepository.save).not.toHaveBeenCalled();
  });
});
