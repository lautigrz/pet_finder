import { describe, it, expect, vi, beforeEach } from "vitest";
import { NodemailerEmailService } from "../NodemailerEmailService";
import { InvalidEmailError } from "@domain/errors/InvalidEmailError";
import { AppealTargetType } from "@domain/appeal/types/appeal-target-type";

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

  it("adjunta el logo inline y lo referencia por cid en el header", async () => {
    await service.sendVerificationLink("juan@example.com", "tok");

    const call = sendMail.mock.calls[0]![0];
    expect(call.html).toContain('src="cid:petfinder-logo"');
    expect(call.attachments).toEqual([
      expect.objectContaining({ cid: "petfinder-logo", filename: "petfinder-logo.png" }),
    ]);
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

  it("coincidencia: manda con el porcentaje, el nombre, la foto y el link a las coincidencias del reporte", async () => {
    await service.sendMatchAlert("juan@example.com", "Pupo", 80, "lost-1", "https://img/milo.jpg");

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "juan@example.com",
        subject: expect.stringContaining("coincidencia"),
        html: expect.stringContaining("http://localhost:4200/reports/lost-1/matches"),
      }),
    );
    const html = sendMail.mock.calls[0]![0].html;
    expect(html).toContain("80%");
    expect(html).toContain("Pupo");
    expect(html).toContain("https://img/milo.jpg");
  });

  it("coincidencia sin foto: usa el isotipo y lo adjunta inline", async () => {
    await service.sendMatchAlert("juan@example.com", "Pupo", 80, "lost-1", null);

    const call = sendMail.mock.calls[0]![0];
    expect(call.html).toContain('src="cid:petfinder-isotipo"');
    expect(call.attachments).toEqual([
      expect.objectContaining({ cid: "petfinder-logo" }),
      expect.objectContaining({ cid: "petfinder-isotipo", filename: "petfinder-isotipo.png" }),
    ]);
  });

  it("comprobante de pago: incluye monto, N° de operación y link al reporte", async () => {
    await service.sendFeaturedPaymentReceipt("juan@example.com", 100, "ARS", "op-123", "rep-1");

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "juan@example.com",
        subject: expect.stringContaining("Comprobante"),
        html: expect.stringContaining("http://localhost:4200/reports/rep-1"),
      }),
    );
    const html = sendMail.mock.calls[0]![0].html;
    expect(html).toContain("$100");
    expect(html).toContain("#op-123");
  });

  it("publicación dada de baja: asunto y botón para apelar con el token", async () => {
    await service.sendPublicationRemovedNotice("juan@example.com", "tok-appeal");

    const html = sendMail.mock.calls[0]![0].html;
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: "juan@example.com", subject: expect.stringContaining("dada de baja") }));
    expect(html).toContain("dio de baja");
    expect(html).toContain("Apelar");
    expect(html).toContain("http://localhost:4200/appeals/new?token=tok-appeal");
  });

  it("cuenta suspendida: incluye el motivo del admin y el botón para apelar", async () => {
    await service.sendAccountSuspendedNotice("juan@example.com", "Contenido fraudulento", "tok-appeal");

    const html = sendMail.mock.calls[0]![0].html;
    expect(html).toContain("suspendió tu cuenta");
    expect(html).toContain("Motivo:");
    expect(html).toContain("Contenido fraudulento");
    expect(html).toContain("http://localhost:4200/appeals/new?token=tok-appeal");
  });

  it("cuenta suspendida: escapa el HTML del motivo", async () => {
    await service.sendAccountSuspendedNotice("juan@example.com", "<script>alert(1)</script>", "tok-appeal");

    const html = sendMail.mock.calls[0]![0].html;
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("cuenta suspendida sin motivo: no incluye la caja de motivo", async () => {
    await service.sendAccountSuspendedNotice("juan@example.com", null, "tok-appeal");

    const html = sendMail.mock.calls[0]![0].html;
    expect(html).not.toContain("Motivo:");
  });

  it("apelación aceptada (publicación): asunto y cuerpo de recuperación", async () => {
    await service.sendAppealAcceptedNotice("juan@example.com", AppealTargetType.POST);

    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ subject: expect.stringContaining("aceptada") }));
    expect(sendMail.mock.calls[0]![0].html).toContain("recuperaste tu publicación");
  });

  it("apelación rechazada (cuenta): se mantuvo la suspensión", async () => {
    await service.sendAppealRejectedNotice("juan@example.com", AppealTargetType.ACCOUNT);

    expect(sendMail.mock.calls[0]![0].html).toContain("se mantuvo la suspensión de tu cuenta");
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
