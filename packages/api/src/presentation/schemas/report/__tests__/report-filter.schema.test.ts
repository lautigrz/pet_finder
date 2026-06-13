import { describe, expect, it } from "vitest";
import { getFilteredReportsSchema } from "../report-filter.schema";

describe("getFilteredReportsSchema", () => {
    it("acepta una query vacía", () => {
        const result = getFilteredReportsSchema.safeParse({
            query: {},
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.query).toEqual({});
        }
    });

    it("normaliza reportType, animalType y status a mayúsculas", () => {
        const result = getFilteredReportsSchema.safeParse({
            query: {
                reportType: "lost",
                animalType: "dog",
                status: "active",
            },
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.query.reportType).toBe("LOST");
            expect(result.data.query.animalType).toBe("DOG");
            expect(result.data.query.status).toBe("ACTIVE");
        }
    });

    it("coacciona las coordenadas y el radio recibidos como strings", () => {
        const result = getFilteredReportsSchema.safeParse({
            query: {
                lat: "-34.6037",
                lng: "-58.3816",
                radiusKm: "5",
            },
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.query.lat).toBe(-34.6037);
            expect(result.data.query.lng).toBe(-58.3816);
            expect(result.data.query.radiusKm).toBe(5);
        }
    });

    it("acepta fechas válidas", () => {
        const result = getFilteredReportsSchema.safeParse({
            query: {
                createdFrom: "2026-06-01",
                createdTo: "2026-06-10",
            },
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.query.createdFrom).toBe("2026-06-01");
            expect(result.data.query.createdTo).toBe("2026-06-10");
        }
    });

    it("acepta recent como criterio de ordenamiento", () => {
        const result = getFilteredReportsSchema.safeParse({
            query: {
                sort: "recent",
            },
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.query.sort).toBe("recent");
        }
    });

    describe("q", () => {
        it("acepta una búsqueda de al menos 2 caracteres", () => {
            const result = getFilteredReportsSchema.safeParse({
                query: {
                    q: "pe",
                },
            });

            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.data.query.q).toBe("pe");
            }
        });

        it("elimina los espacios externos de la búsqueda", () => {
            const result = getFilteredReportsSchema.safeParse({
                query: {
                    q: "  collar rojo  ",
                },
            });

            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.data.query.q).toBe("collar rojo");
            }
        });

        it("acepta una búsqueda de exactamente 100 caracteres", () => {
            const q = "a".repeat(100);

            const result = getFilteredReportsSchema.safeParse({
                query: {
                    q,
                },
            });

            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.data.query.q).toBe(q);
            }
        });

        it("rechaza una búsqueda de menos de 2 caracteres", () => {
            const result = getFilteredReportsSchema.safeParse({
                query: {
                    q: "p",
                },
            });

            expect(result.success).toBe(false);
        });

        it("rechaza una búsqueda con solo espacios", () => {
            const result = getFilteredReportsSchema.safeParse({
                query: {
                    q: "   ",
                },
            });

            expect(result.success).toBe(false);
        });

        it("rechaza una búsqueda de más de 100 caracteres", () => {
            const result = getFilteredReportsSchema.safeParse({
                query: {
                    q: "a".repeat(101),
                },
            });

            expect(result.success).toBe(false);
        });
    });

    it("rechaza un reportType inválido", () => {
        const result = getFilteredReportsSchema.safeParse({
            query: {
                reportType: "UNKNOWN",
            },
        });

        expect(result.success).toBe(false);
    });

    it("rechaza un animalType inválido", () => {
        const result = getFilteredReportsSchema.safeParse({
            query: {
                animalType: "BIRD",
            },
        });

        expect(result.success).toBe(false);
    });

    it("rechaza un status inválido", () => {
        const result = getFilteredReportsSchema.safeParse({
            query: {
                status: "PENDING",
            },
        });

        expect(result.success).toBe(false);
    });

    it("rechaza una latitud fuera de rango", () => {
        const result = getFilteredReportsSchema.safeParse({
            query: {
                lat: "91",
            },
        });

        expect(result.success).toBe(false);
    });

    it("rechaza una longitud fuera de rango", () => {
        const result = getFilteredReportsSchema.safeParse({
            query: {
                lng: "-181",
            },
        });

        expect(result.success).toBe(false);
    });

    it("rechaza un radio igual o menor a cero", () => {
        const result = getFilteredReportsSchema.safeParse({
            query: {
                radiusKm: "0",
            },
        });

        expect(result.success).toBe(false);
    });

    it("rechaza un criterio de ordenamiento inválido", () => {
        const result = getFilteredReportsSchema.safeParse({
            query: {
                sort: "oldest",
            },
        });

        expect(result.success).toBe(false);
    });

    it("rechaza una fecha con formato inválido", () => {
        const result = getFilteredReportsSchema.safeParse({
            query: {
                createdFrom: "13-06-2026",
            },
        });

        expect(result.success).toBe(false);
    });
});