import exifr from "exifr";
import { ExifReader } from "@application/ports/ExifReader";
import { ExifReadResult } from "@domain/shared/exif/exif-suspicion.analyzer";
import logger from "@infrastructure/logger";

const PARSE_OPTIONS = {
    tiff: true,
    exif: true,
    gps: false,
    translateKeys: true,
    translateValues: true,
    reviveValues: true,
};

export class ExifrExifReader implements ExifReader {
    async read(buffer: Buffer): Promise<ExifReadResult> {
        try {
            const metadata = await exifr.parse(buffer, PARSE_OPTIONS);

            if (!metadata || typeof metadata !== "object" || Object.keys(metadata).length === 0) {
                return { parsed: true, metadata: null };
            }

            return { parsed: true, metadata: metadata as Record<string, unknown> };
        } catch (error) {
            logger.warn(`EXIF parsing failed: ${error instanceof Error ? error.message : "unknown error"}`);
            return { parsed: false, metadata: null };
        }
    }
}
