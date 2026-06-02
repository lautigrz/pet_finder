import { describe, it, expect, vi, beforeEach } from "vitest";
import { NodemailerEmailService } from "../NodemailerEmailService";
import { InvalidEmailError } from "@domain/errors/InvalidEmailError";

describe("NodemailerEmailService", () => {
  let sendMail: ReturnType<typeof vi.fn>;
  let service: NodemailerEmailService;

  beforeEach(() => {
    sendMail = vi.fn().mockResolvedValue({ messageId: "id-1" });
    service = new NodemailerEmailService(
      { sendMail } as never,
      "PetFinder <no-reply@gmail.com>",
      "http://localhost:4200",
    );
  });

  it("verificación: manda con from, to y link de verify con el token", async () => {
    await service.sendVerificationLink("juan@example.com", "tok-1");

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "PetFinder <no-reply@gmail.com>",
        to: "juan@example.com",
        subject: expect.stringContaining("Verific"),
        html: expect.stringContaining("http://localhost:4200/verify-email?token=tok-1"),
      }),
    );
  });

  it("reset: manda con el link de reset y el token", async () => {
    await service.sendPasswordResetLink("juan@example.com", "tok-2");

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "juan@example.com",
        html: expect.stringContaining("http://localhost:4200/reset-password?token=tok-2"),
      }),
    );
  });

  it("email inválido: lanza InvalidEmailError y no manda", async () => {
    const accion = () => service.sendVerificationLink("no-es-email", "tok");

    await expect(accion).rejects.toThrow(InvalidEmailError);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("si el transporte falla, propaga el error", async () => {
    sendMail.mockRejectedValue(new Error("smtp down"));

    const accion = () => service.sendVerificationLink("juan@example.com", "tok");

    await expect(accion).rejects.toThrow(/smtp down/);
  });
});
