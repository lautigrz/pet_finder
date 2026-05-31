import { describe, it, expect, vi } from "vitest";
import upload from "../CloudinaryMulterUpload";

/**
 * Accede al fileFilter interno de la instancia de Multer para poder testear
 * qué tipos de archivo se aceptan o rechazan.
 * Multer expone el fileFilter como propiedad pública en la instancia.
 */
const getFileFilter = () => {
  // multer exposes fileFilter directly (not as _fileFilter)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (upload as any).fileFilter as (
    req: unknown,
    file: { mimetype: string },
    cb: (error: Error | null, accept: boolean) => void
  ) => void;
};

describe("CloudinaryMulterUpload (Multer config)", () => {
  describe("fileFilter — tipos aceptados", () => {
    const acceptedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    for (const mime of acceptedMimes) {
      it(`acepta archivos de tipo ${mime}`, () => {
        const fileFilter = getFileFilter();
        const cb = vi.fn();

        fileFilter({}, { mimetype: mime }, cb);

        expect(cb).toHaveBeenCalledWith(null, true);
      });
    }
  });

  describe("fileFilter — tipos rechazados", () => {
    const rejectedMimes = ["image/gif", "application/pdf", "text/plain", "video/mp4"];

    for (const mime of rejectedMimes) {
      it(`rechaza archivos de tipo ${mime}`, () => {
        const fileFilter = getFileFilter();
        const cb = vi.fn();

        fileFilter({}, { mimetype: mime }, cb);

        expect(cb).toHaveBeenCalledWith(expect.any(Error));
        const [error] = cb.mock.calls[0] as [Error];
        expect(error.message).toBe("Invalid file type");
      });
    }
  });

  describe("limits", () => {
    it("tiene límite de 5MB por archivo (fileSize)", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const limits = (upload as any).limits as { fileSize: number; files: number };
      expect(limits.fileSize).toBe(5 * 1024 * 1024);
    });

    it("tiene límite de 5 archivos por request (files)", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const limits = (upload as any).limits as { fileSize: number; files: number };
      expect(limits.files).toBe(5);
    });
  });

  describe("storage", () => {
    it("usa memoria como almacenamiento (memoryStorage)", () => {
      // El storage de memoryStorage no tiene disco — _handleFile existe en memoria
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storage = (upload as any).storage as { _handleFile?: unknown };
      expect(storage).toBeDefined();
      // multer.memoryStorage() tiene _handleFile que escribe en buffer
      expect(typeof storage._handleFile).toBe("function");
    });
  });
});
