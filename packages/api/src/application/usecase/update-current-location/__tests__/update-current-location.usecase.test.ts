import { beforeEach, describe, expect, it, vi } from "vitest";

import { UpdateCurrentLocationUseCase } from "../update-current-location.usecase";
import { UpdateCurrentLocationInput } from "../update-current-location.input";

import type { IUserRepository } from "@domain/repositories/IUserRepository";

describe("UpdateCurrentLocationUseCase", () => {
  let userRepository: IUserRepository;

  let useCase: UpdateCurrentLocationUseCase;

  beforeEach(() => {
    userRepository = {
      updateCurrentLocation: vi.fn().mockResolvedValue(undefined),
    } as unknown as IUserRepository;

    useCase = new UpdateCurrentLocationUseCase(userRepository);
  });

  describe("execute", () => {
    it("updates the current location of the user", async () => {
      // Given
      const input = new UpdateCurrentLocationInput(
        "user-public-id",
        -34.6037,
        -58.3816,
      );

      // When
      await useCase.execute(input);

      // Then
      expect(userRepository.updateCurrentLocation).toHaveBeenCalledOnce();

      expect(userRepository.updateCurrentLocation).toHaveBeenCalledWith(
        "user-public-id",
        -34.6037,
        -58.3816,
        expect.any(Date),
      );
    });

    it("propagates repository errors", async () => {
      // Given
      vi.mocked(userRepository.updateCurrentLocation).mockRejectedValue(
        new Error("Database error"),
      );

      const input = new UpdateCurrentLocationInput(
        "user-public-id",
        -34.6037,
        -58.3816,
      );

      // When / Then
      await expect(useCase.execute(input)).rejects.toThrow("Database error");
    });
  });
});
