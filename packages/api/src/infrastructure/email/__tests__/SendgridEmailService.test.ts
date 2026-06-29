import { describe, it, expect, vi, afterEach } from "vitest";
import { SendgridEmailService } from "../SendgridEmailService";

const ENDPOINT = "https://api.sendgrid.com/v3/mail/send";

function mockFetch(response: { ok: boolean; status?: number; text?: string }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? 202,
    text: async () => response.text ?? "",
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("SendgridEmailService", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("postea a la API de SendGrid con el link de verificación y el from parseado", async () => {
    const fetchMock = mockFetch({ ok: true });
    const service = new SendgridEmailService(
      "SG.key",
      "PetFinder <petfinder.apptpi2026@gmail.com>",
      "https://front.vercel.app",
    );

    await service.sendVerificationLink("dest@mail.com", "tok123");

    expect(fetchMock).toHaveBeenCalledWith(ENDPOINT, expect.objectContaining({ method: "POST" }));
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(body.from).toEqual({ name: "PetFinder", email: "petfinder.apptpi2026@gmail.com" });
    expect(body.personalizations[0].to[0].email).toBe("dest@mail.com");
    expect(body.content[0].value).toContain("https://front.vercel.app/verify-email?token=tok123");
  });

  it("usa el endpoint de reset con su link", async () => {
    const fetchMock = mockFetch({ ok: true });
    const service = new SendgridEmailService("SG.key", "x@mail.com", "https://front.vercel.app");

    await service.sendPasswordResetLink("dest@mail.com", "tok456");

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(body.from).toEqual({ email: "x@mail.com" });
    expect(body.content[0].value).toContain("https://front.vercel.app/reset-password?token=tok456");
  });

  it("tira error si SendGrid no responde OK", async () => {
    mockFetch({ ok: false, status: 401, text: "unauthorized" });
    const service = new SendgridEmailService("SG.bad", "x@mail.com", "https://front.vercel.app");

    await expect(service.sendVerificationLink("dest@mail.com", "t")).rejects.toThrow("401");
  });
});
