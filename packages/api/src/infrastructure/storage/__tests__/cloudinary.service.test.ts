import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock CloudinaryConfig BEFORE importing ClaudinaryService to prevent env-var check
vi.mock("@infrastructure/storage/CloudinaryConfig", () => ({
  cloudinary: {
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn(),
    },
  },
}));

import { ClaudinaryService } from "../CloudinaryService";
import { cloudinary } from "@infrastructure/storage/CloudinaryConfig";

describe("ClaudinaryService", () => {
  let service: ClaudinaryService;

  beforeEach(() => {
    service = new ClaudinaryService();
    vi.clearAllMocks();
  });

  // ─── upload ──────────────────────────────────────────────────────────────

  describe("upload", () => {
    it("resuelve con url y publicId cuando Cloudinary devuelve resultado", async () => {
      const fakeResult = {
        secure_url: "https://res.cloudinary.com/demo/image/upload/pets/abc.jpg",
        public_id: "pets/abc",
      };

      // Simula que upload_stream llama al callback con el resultado
      vi.mocked(cloudinary.uploader.upload_stream).mockImplementation(
        (_options: unknown, callback: (err: unknown, result: unknown) => void) => {
          callback(undefined, fakeResult);
          // Devuelve un stream fake con end()
          return { end: vi.fn() } as unknown as ReturnType<typeof cloudinary.uploader.upload_stream>;
        }
      );

      const buffer = Buffer.from("fake-image-data");
      const result = await service.upload(buffer, "pets");

      expect(result.url).toBe(fakeResult.secure_url);
      expect(result.publicId).toBe(fakeResult.public_id);
    });

    it("rechaza si Cloudinary devuelve un error", async () => {
      const fakeError = new Error("Cloudinary upload failed");

      vi.mocked(cloudinary.uploader.upload_stream).mockImplementation(
        (_options: unknown, callback: (err: unknown, result: unknown) => void) => {
          callback(fakeError, undefined);
          return { end: vi.fn() } as unknown as ReturnType<typeof cloudinary.uploader.upload_stream>;
        }
      );

      await expect(service.upload(Buffer.from("img"), "pets")).rejects.toThrow(
        "Cloudinary upload failed"
      );
    });

    it("rechaza si Cloudinary no devuelve resultado (result es undefined)", async () => {
      vi.mocked(cloudinary.uploader.upload_stream).mockImplementation(
        (_options: unknown, callback: (err: unknown, result: unknown) => void) => {
          callback(undefined, undefined);
          return { end: vi.fn() } as unknown as ReturnType<typeof cloudinary.uploader.upload_stream>;
        }
      );

      await expect(service.upload(Buffer.from("img"))).rejects.toThrow(
        "Cloudinary no devolvió resultado"
      );
    });

    it("llama a upload_stream con la carpeta (folder) correcta", async () => {
      const fakeResult = {
        secure_url: "https://url.com/img.jpg",
        public_id: "reports/xyz",
      };

      vi.mocked(cloudinary.uploader.upload_stream).mockImplementation(
        (_options: unknown, callback: (err: unknown, result: unknown) => void) => {
          callback(undefined, fakeResult);
          return { end: vi.fn() } as unknown as ReturnType<typeof cloudinary.uploader.upload_stream>;
        }
      );

      await service.upload(Buffer.from("img"), "reports");

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        { folder: "reports" },
        expect.any(Function)
      );
    });
  });

  // ─── delete ──────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("resuelve sin error si Cloudinary elimina exitosamente", async () => {
      vi.mocked(cloudinary.uploader.destroy).mockImplementation(
        (_publicId: string, callback: (err: unknown, result: unknown) => void) => {
          callback(undefined, { result: "ok" });
          return undefined as unknown as ReturnType<typeof cloudinary.uploader.destroy>;
        }
      );

      await expect(service.delete("pets/abc")).resolves.toBeUndefined();
    });

    it("rechaza si Cloudinary devuelve un error al eliminar", async () => {
      const fakeError = new Error("Cloudinary delete failed");

      vi.mocked(cloudinary.uploader.destroy).mockImplementation(
        (_publicId: string, callback: (err: unknown, result: unknown) => void) => {
          callback(fakeError, undefined);
          return undefined as unknown as ReturnType<typeof cloudinary.uploader.destroy>;
        }
      );

      await expect(service.delete("pets/abc")).rejects.toThrow("Cloudinary delete failed");
    });

    it("rechaza si destroy no devuelve resultado", async () => {
      vi.mocked(cloudinary.uploader.destroy).mockImplementation(
        (_publicId: string, callback: (err: unknown, result: unknown) => void) => {
          callback(undefined, undefined);
          return undefined as unknown as ReturnType<typeof cloudinary.uploader.destroy>;
        }
      );

      await expect(service.delete("pets/abc")).rejects.toThrow(
        "Cloudinary no devolvió resultado"
      );
    });
  });
});
