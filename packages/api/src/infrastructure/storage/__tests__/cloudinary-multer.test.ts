import { describe, it, expect, vi } from "vitest";
import upload from "../CloudinaryMulterUpload";

const getFileFilter = () => {

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

      const limits = (upload as any).limits as { fileSize: number; files: number };
      expect(limits.fileSize).toBe(5 * 1024 * 1024);
    });

    it("tiene límite de 5 archivos por request (files)", () => {

      const limits = (upload as any).limits as { fileSize: number; files: number };
      expect(limits.files).toBe(5);
    });
  });

  describe("storage", () => {
    it("usa memoria como almacenamiento (memoryStorage)", () => {

      const storage = (upload as any).storage as { _handleFile?: unknown };
      expect(storage).toBeDefined();

      expect(typeof storage._handleFile).toBe("function");
    });
  });
});
