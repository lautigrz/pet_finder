import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";

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
      } as UploadApiResponse;

      (cloudinary.uploader.upload_stream as any).mockImplementation(
        (_options: any, callback: any) => {
          callback(undefined, fakeResult);
          return { end: vi.fn() };
        }
      );

      const buffer = Buffer.from("fake-image-data");
      const result = await service.upload(buffer, "pets");

      expect(result.url).toBe(fakeResult.secure_url);
      expect(result.publicId).toBe(fakeResult.public_id);
    });

    it("rechaza si Cloudinary devuelve un error", async () => {
      const fakeError = new Error("Cloudinary upload failed") as unknown as UploadApiErrorResponse;

      (cloudinary.uploader.upload_stream as any).mockImplementation(
        (_options: any, callback: any) => {
          callback(fakeError, undefined);
          return { end: vi.fn() };
        }
      );

      await expect(service.upload(Buffer.from("img"), "pets")).rejects.toThrow(
        "Cloudinary upload failed"
      );
    });

    it("rechaza si Cloudinary no devuelve resultado (result es undefined)", async () => {
      (cloudinary.uploader.upload_stream as any).mockImplementation(
        (_options: any, callback: any) => {
          callback(undefined, undefined);
          return { end: vi.fn() };
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
      } as UploadApiResponse;

      (cloudinary.uploader.upload_stream as any).mockImplementation(
        (_options: any, callback: any) => {
          callback(undefined, fakeResult);
          return { end: vi.fn() };
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
      (cloudinary.uploader.destroy as any).mockImplementation(
        (_publicId: string, callback?: any) => {
          callback?.(undefined, { result: "ok" });
          return undefined;
        }
      );

      await expect(service.delete("pets/abc")).resolves.toBeUndefined();
    });

    it("rechaza si Cloudinary devuelve un error al eliminar", async () => {
      const fakeError = new Error("Cloudinary delete failed");

      (cloudinary.uploader.destroy as any).mockImplementation(
        (_publicId: string, callback?: any) => {
          callback?.(fakeError, undefined);
          return undefined;
        }
      );

      await expect(service.delete("pets/abc")).rejects.toThrow("Cloudinary delete failed");
    });

    it("rechaza si destroy no devuelve resultado", async () => {
      (cloudinary.uploader.destroy as any).mockImplementation(
        (_publicId: string, callback?: any) => {
          callback?.(undefined, undefined);
          return undefined;
        }
      );

      await expect(service.delete("pets/abc")).rejects.toThrow(
        "Cloudinary no devolvió resultado"
      );
    });
  });
});
