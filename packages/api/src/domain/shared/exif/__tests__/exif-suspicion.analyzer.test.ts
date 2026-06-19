import { describe, it, expect } from "vitest";
import {
    ExifSuspicionAnalyzer,
    EXIF_REASON,
    MAX_CAPTURE_AGE_YEARS,
} from "@domain/shared/exif/exif-suspicion.analyzer";

const NOW = new Date("2026-06-18T12:00:00.000Z");

const recentDate = new Date("2026-01-10T10:00:00.000Z");
const tooOldDate = new Date("2008-01-10T10:00:00.000Z");

describe("ExifSuspicionAnalyzer", () => {
    describe("cuando el parseo falló (no-bloqueante)", () => {
        it("no marca sospechoso y no devuelve motivos", () => {
            const result = ExifSuspicionAnalyzer.analyze({ parsed: false, metadata: null }, NOW);

            expect(result.isSuspicious).toBe(false);
            expect(result.reasons).toEqual([]);
        });
    });

    describe("ausencia total de EXIF", () => {
        it("marca sospechoso cuando la metadata es null", () => {
            const result = ExifSuspicionAnalyzer.analyze({ parsed: true, metadata: null }, NOW);

            expect(result.isSuspicious).toBe(true);
            expect(result.reasons).toContain(EXIF_REASON.NO_METADATA);
        });

        it("marca sospechoso cuando la metadata viene vacía", () => {
            const result = ExifSuspicionAnalyzer.analyze({ parsed: true, metadata: {} }, NOW);

            expect(result.isSuspicious).toBe(true);
            expect(result.reasons).toContain(EXIF_REASON.NO_METADATA);
        });
    });

    describe("fecha de captura", () => {
        it("marca sospechoso cuando falta la fecha de captura", () => {
            const result = ExifSuspicionAnalyzer.analyze(
                { parsed: true, metadata: { Make: "Canon" } },
                NOW,
            );

            expect(result.isSuspicious).toBe(true);
            expect(result.reasons).toContain(EXIF_REASON.NO_CAPTURE_DATE);
        });

        it(`marca sospechoso cuando la captura es anterior a ${MAX_CAPTURE_AGE_YEARS} años`, () => {
            const result = ExifSuspicionAnalyzer.analyze(
                { parsed: true, metadata: { DateTimeOriginal: tooOldDate } },
                NOW,
            );

            expect(result.isSuspicious).toBe(true);
            expect(result.reasons).toContain(EXIF_REASON.CAPTURE_TOO_OLD);
        });

        it("no marca sospechoso cuando la captura es reciente", () => {
            const result = ExifSuspicionAnalyzer.analyze(
                { parsed: true, metadata: { DateTimeOriginal: recentDate } },
                NOW,
            );

            expect(result.isSuspicious).toBe(false);
            expect(result.reasons).toEqual([]);
        });

        it("usa CreateDate cuando no hay DateTimeOriginal", () => {
            const result = ExifSuspicionAnalyzer.analyze(
                { parsed: true, metadata: { CreateDate: recentDate } },
                NOW,
            );

            expect(result.isSuspicious).toBe(false);
        });
    });

    describe("software de edición", () => {
        it("agrega un motivo pero NO marca sospechoso por sí solo", () => {
            const result = ExifSuspicionAnalyzer.analyze(
                { parsed: true, metadata: { DateTimeOriginal: recentDate, Software: "Adobe Photoshop 25.0" } },
                NOW,
            );

            expect(result.isSuspicious).toBe(false);
            expect(result.reasons).toContain(EXIF_REASON.editedWith("Adobe Photoshop 25.0"));
        });

        it("detecta el software sin importar mayúsculas/minúsculas", () => {
            const result = ExifSuspicionAnalyzer.analyze(
                { parsed: true, metadata: { DateTimeOriginal: recentDate, Software: "GIMP 2.10" } },
                NOW,
            );

            expect(result.reasons).toContain(EXIF_REASON.editedWith("GIMP 2.10"));
        });

        it("ignora software no relacionado con edición", () => {
            const result = ExifSuspicionAnalyzer.analyze(
                { parsed: true, metadata: { DateTimeOriginal: recentDate, Software: "iOS 17.1" } },
                NOW,
            );

            expect(result.isSuspicious).toBe(false);
            expect(result.reasons).toEqual([]);
        });

        it("combina motivos cuando además es sospechoso", () => {
            const result = ExifSuspicionAnalyzer.analyze(
                { parsed: true, metadata: { DateTimeOriginal: tooOldDate, Software: "GIMP" } },
                NOW,
            );

            expect(result.isSuspicious).toBe(true);
            expect(result.reasons).toContain(EXIF_REASON.CAPTURE_TOO_OLD);
            expect(result.reasons).toContain(EXIF_REASON.editedWith("GIMP"));
        });
    });

    describe("analyzeMany", () => {
        it("marca sospechoso si al menos una imagen lo es", () => {
            const result = ExifSuspicionAnalyzer.analyzeMany(
                [
                    { parsed: true, metadata: { DateTimeOriginal: recentDate } },
                    { parsed: true, metadata: null },
                ],
                NOW,
            );

            expect(result.isSuspicious).toBe(true);
            expect(result.reasons).toContain(EXIF_REASON.NO_METADATA);
        });

        it("no marca sospechoso si ninguna lo es y deduplica motivos", () => {
            const result = ExifSuspicionAnalyzer.analyzeMany(
                [
                    { parsed: true, metadata: { DateTimeOriginal: recentDate, Software: "GIMP" } },
                    { parsed: true, metadata: { DateTimeOriginal: recentDate, Software: "GIMP" } },
                ],
                NOW,
            );

            expect(result.isSuspicious).toBe(false);
            expect(result.reasons).toEqual([EXIF_REASON.editedWith("GIMP")]);
        });

        it("devuelve no sospechoso para una lista vacía", () => {
            const result = ExifSuspicionAnalyzer.analyzeMany([], NOW);

            expect(result.isSuspicious).toBe(false);
            expect(result.reasons).toEqual([]);
        });
    });
});
