import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetPublicProfileUseCase } from "@application/usecase/get-public-profile/get-public-profile.usecase";
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { User } from "@domain/entities/User";

const TARGET_PUBLIC_ID = "target-public-id";

const fakeUser = User.reconstruct(
  7,
  TARGET_PUBLIC_ID,
  "target@example.com",
  "targetuser",
  "$2b$10$" + "x".repeat(53),
  true,
  new Date(),
  "Ana",
  "García",
  "https://fake.com/photo.jpg",
);

describe("GetPublicProfileUseCase", () => {
  let userRepository: IUserRepository;
  let useCase: GetPublicProfileUseCase;

  beforeEach(() => {
    userRepository = {
      findByPublicId: vi.fn().mockResolvedValue(fakeUser),
    } as unknown as IUserRepository;

    useCase = new GetPublicProfileUseCase(userRepository);
  });

  it("devuelve los datos públicos del usuario", async () => {
    const result = await useCase.execute(TARGET_PUBLIC_ID);

    expect(userRepository.findByPublicId).toHaveBeenCalledWith(TARGET_PUBLIC_ID);
    expect(result).toEqual({
      id: TARGET_PUBLIC_ID,
      username: "targetuser",
      name: "Ana",
      lastname: "García",
      photoUrl: "https://fake.com/photo.jpg",
    });
  });

  it("no expone el email del usuario", async () => {
    const result = await useCase.execute(TARGET_PUBLIC_ID);

    expect(result).not.toHaveProperty("email");
  });

  it("lanza UserNotFoundError si el usuario no existe", async () => {
    vi.mocked(userRepository.findByPublicId).mockResolvedValue(null);

    await expect(useCase.execute("inexistente")).rejects.toThrow(UserNotFoundError);
  });

  it("lanza UserNotFoundError si el usuario está suspendido", async () => {
    const suspended = User.reconstruct(
      7,
      TARGET_PUBLIC_ID,
      "target@example.com",
      "targetuser",
      "$2b$10$" + "x".repeat(53),
      true,
      new Date(),
      "Ana",
      "García",
      "https://fake.com/photo.jpg",
      true,
    );
    vi.mocked(userRepository.findByPublicId).mockResolvedValue(suspended);

    await expect(useCase.execute(TARGET_PUBLIC_ID)).rejects.toThrow(UserNotFoundError);
  });
});
