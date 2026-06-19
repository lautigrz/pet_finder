export interface ExifReadResult {
    parsed: boolean;
    metadata: Record<string, unknown> | null;
}

export interface ExifAnalysis {
    isSuspicious: boolean;
    reasons: string[];
    exifData: Record<string, unknown>;
}

export const MAX_CAPTURE_AGE_YEARS = 15;

export const EXIF_REASON = {
    NO_METADATA: 'Imagen sin metadatos EXIF',
    NO_CAPTURE_DATE: 'Imagen sin fecha de captura',
    CAPTURE_TOO_OLD: `Fecha de captura anterior a ${MAX_CAPTURE_AGE_YEARS} años`,
    editedWith: (software: string) => `Imagen editada con software de edición: ${software}`,
} as const;

const EDITING_SOFTWARE_KEYWORDS = [
    'photoshop',
    'gimp',
    'lightroom',
    'snapseed',
    'pixlr',
    'paint.net',
    'affinity',
    'canva',
    'picsart',
    'facetune',
];

const CAPTURE_DATE_KEYS = ['DateTimeOriginal', 'CreateDate', 'DateTime'];

export class ExifSuspicionAnalyzer {

    static analyze(result: ExifReadResult, now: Date = new Date()): ExifAnalysis {
        if (!result.parsed) {
            return { isSuspicious: false, reasons: [], exifData: {} };
        }

        const metadata = result.metadata;
        if (!metadata || Object.keys(metadata).length === 0) {
            return { isSuspicious: true, reasons: [EXIF_REASON.NO_METADATA], exifData: {} };
        }

        const reasons: string[] = [];
        let isSuspicious = false;

        const captureDate = this.extractCaptureDate(metadata);
        if (!captureDate) {
            reasons.push(EXIF_REASON.NO_CAPTURE_DATE);
            isSuspicious = true;
        } else if (this.isOlderThanYears(captureDate, MAX_CAPTURE_AGE_YEARS, now)) {
            reasons.push(EXIF_REASON.CAPTURE_TOO_OLD);
            isSuspicious = true;
        }

        const editingSoftware = this.detectEditingSoftware(metadata);
        if (editingSoftware) {
            reasons.push(EXIF_REASON.editedWith(editingSoftware));
        }

        return { isSuspicious, reasons, exifData: metadata };
    }

    static analyzeMany(results: ExifReadResult[], now: Date = new Date()): ExifAnalysis {
        const analyses = results.map((result) => this.analyze(result, now));
        const reasons = [...new Set(analyses.flatMap((analysis) => analysis.reasons))];
        const isSuspicious = analyses.some((analysis) => analysis.isSuspicious);
        return { isSuspicious, reasons, exifData: {} };
    }

    private static extractCaptureDate(metadata: Record<string, unknown>): Date | null {
        for (const key of CAPTURE_DATE_KEYS) {
            const date = this.toDate(metadata[key]);
            if (date) return date;
        }
        return null;
    }

    private static toDate(value: unknown): Date | null {
        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }
        if (typeof value === 'string' || typeof value === 'number') {
            const parsed = new Date(value);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }
        return null;
    }

    private static isOlderThanYears(date: Date, years: number, now: Date): boolean {
        const threshold = new Date(now);
        threshold.setFullYear(threshold.getFullYear() - years);
        return date.getTime() < threshold.getTime();
    }

    private static detectEditingSoftware(metadata: Record<string, unknown>): string | null {
        const software = metadata['Software'];
        if (typeof software !== 'string') {
            return null;
        }
        const normalized = software.toLowerCase();
        const matched = EDITING_SOFTWARE_KEYWORDS.some((keyword) => normalized.includes(keyword));
        return matched ? software : null;
    }
}
