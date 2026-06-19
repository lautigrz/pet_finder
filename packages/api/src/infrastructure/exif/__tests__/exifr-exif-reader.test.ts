import { describe, it, expect, vi, beforeEach } from "vitest";
import exifr from "exifr";
import { ExifrExifReader } from "@infrastructure/exif/ExifrExifReader";

vi.mock("exifr", () => ({
    default: { parse: vi.fn() },
}));

vi.mock("@infrastructure/logger", () => ({
    default: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

describe("ExifrExifReader", () => {
    let reader: ExifrExifReader;
    const buffer = Buffer.from("fake-image");

    beforeEach(() => {
        vi.clearAllMocks();
        reader = new ExifrExifReader();
    });

    it("devuelve la metadata cuando exifr encuentra datos", async () => {
        const metadata = { Make: "Canon", DateTimeOriginal: new Date() };
        vi.mocked(exifr.parse).mockResolvedValue(metadata);

        const result = await reader.read(buffer);

        expect(result).toEqual({ parsed: true, metadata });
    });

    it("devuelve metadata null cuando exifr no encuentra EXIF", async () => {
        vi.mocked(exifr.parse).mockResolvedValue(undefined);

        const result = await reader.read(buffer);

        expect(result).toEqual({ parsed: true, metadata: null });
    });

    it("devuelve metadata null cuando exifr devuelve un objeto vacío", async () => {
        vi.mocked(exifr.parse).mockResolvedValue({});

        const result = await reader.read(buffer);

        expect(result).toEqual({ parsed: true, metadata: null });
    });

    it("no rompe y marca parsed=false cuando exifr lanza un error", async () => {
        vi.mocked(exifr.parse).mockRejectedValue(new Error("corrupt image"));

        const result = await reader.read(buffer);

        expect(result).toEqual({ parsed: false, metadata: null });
    });
});
