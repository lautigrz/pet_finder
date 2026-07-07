import { describe, it, expect } from "vitest";
import { Appeal } from "../Appeal";
import { AppealStatus } from "../types/appeal-status";
import { AppealTargetType } from "../types/appeal-target-type";
import { AppealMessageRequiredError } from "../errors/AppealMessageRequiredError";
import { AppealAlreadyResolvedError } from "../errors/AppealAlreadyResolvedError";

const base = {
  publicId: "a-uuid",
  appellantUserId: 5,
  targetType: AppealTargetType.POST,
  targetPublicId: "post-uuid",
  message: "Mi defensa",
};

describe("Appeal", () => {
  it("create arranca en PENDING, sin resolvedAt y con el mensaje trimmeado", () => {
    const appeal = Appeal.create({ ...base, message: "  Mi defensa  " });

    expect(appeal.status).toBe(AppealStatus.PENDING);
    expect(appeal.resolvedAt).toBeNull();
    expect(appeal.message).toBe("Mi defensa");
    expect(appeal.publicId).toBe("a-uuid");
  });

  it("create con mensaje vacío lanza AppealMessageRequiredError", () => {
    expect(() => Appeal.create({ ...base, message: "   " })).toThrow(AppealMessageRequiredError);
  });

  it("accept la pasa a ACCEPTED y setea resolvedAt", () => {
    const appeal = Appeal.create(base);

    appeal.accept();

    expect(appeal.status).toBe(AppealStatus.ACCEPTED);
    expect(appeal.resolvedAt).toBeInstanceOf(Date);
  });

  it("reject la pasa a REJECTED", () => {
    const appeal = Appeal.create(base);

    appeal.reject();

    expect(appeal.status).toBe(AppealStatus.REJECTED);
  });

  it("resolver una apelación ya resuelta lanza AppealAlreadyResolvedError", () => {
    const appeal = Appeal.create(base);
    appeal.accept();

    expect(() => appeal.reject()).toThrow(AppealAlreadyResolvedError);
  });
});
