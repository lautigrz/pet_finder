import { ExifReadResult } from "@domain/shared/exif/exif-suspicion.analyzer";

export interface ExifReader {
    read(buffer: Buffer): Promise<ExifReadResult>;
}
