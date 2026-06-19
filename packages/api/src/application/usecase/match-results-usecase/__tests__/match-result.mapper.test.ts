import { describe, it, expect } from "vitest";
import { MatchResultMapper } from "../mapper/match-result.mapper";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { SightingImage } from "@domain/report/value-objects/sighting.images";
import { AnimalType } from "@domain/shared/animal-type/animal-type";

function makeReport(overrides: Record<string, any> = {}) {
    return {
        idReport: 10,
        publicId: "report-pub-id",
        details: null,
        ...overrides,
    } as any;
}

function makePet(overrides: Record<string, any> = {}) {
    return {
        images: [{ photoUrl: "https://cdn.example.com/pet.jpg" }],
        animalType: "DOG",
        ...overrides,
    } as any;
}

function makeSightingDetails(overrides: {
    animalType?: AnimalType;
    imageUrls?: string[];
} = {}): SightingReportDetails {
    const imageUrls = overrides.imageUrls ?? ["https://cdn.example.com/sighting.jpg"];
    return SightingReportDetails.create({
        animalType: overrides.animalType ?? AnimalType.CAT,
        hasIdCollar: false,
        color: "orange",
        isInTransit: false,
        images: imageUrls.map(url => SightingImage.create({ cloudinaryId: "cloud-id", photoUrl: url })),
    });
}


describe("MatchResultMapper.toDetailsReportDTO", () => {



    describe("cuando se proporciona un pet (reporte LOST)", () => {
        it("retorna DTO con datos del pet", () => {
            const report = makeReport();
            const pet = makePet();

            const result = MatchResultMapper.toDetailsReportDTO(report, pet);

            expect(result).not.toBeNull();
            expect(result).toEqual({
                publicId: "report-pub-id",
                animalType: "DOG",
                images: ["https://cdn.example.com/pet.jpg"],
            });
        });

        it("prioriza el pet sobre los details del report cuando ambos existen", () => {
            const sightingDetails = makeSightingDetails({ animalType: AnimalType.CAT });
            const report = makeReport({ details: sightingDetails });
            const pet = makePet({ animalType: "DOG" });

            const result = MatchResultMapper.toDetailsReportDTO(report, pet);

            expect(result?.animalType).toBe("DOG");
        });

        it("mapea correctamente múltiples imágenes del pet", () => {
            const pet = makePet({
                images: [
                    { photoUrl: "https://cdn.example.com/img1.jpg" },
                    { photoUrl: "https://cdn.example.com/img2.jpg" },
                ],
            });
            const report = makeReport();

            const result = MatchResultMapper.toDetailsReportDTO(report, pet);

            expect(result?.images).toHaveLength(2);
            expect(result?.images).toContain("https://cdn.example.com/img1.jpg");
            expect(result?.images).toContain("https://cdn.example.com/img2.jpg");
        });

        it("retorna array vacío de imágenes si el pet no tiene imágenes", () => {
            const pet = makePet({ images: [] });
            const result = MatchResultMapper.toDetailsReportDTO(makeReport(), pet);
            expect(result?.images).toEqual([]);
        });
    });

    describe("cuando no hay pet pero sí SightingReportDetails", () => {
        it("retorna DTO con datos del avistamiento", () => {
            const sightingDetails = makeSightingDetails();
            const report = makeReport({ details: sightingDetails });

            const result = MatchResultMapper.toDetailsReportDTO(report, undefined);

            expect(result).not.toBeNull();
            expect(result).toEqual({
                publicId: "report-pub-id",
                animalType: "CAT",
                images: ["https://cdn.example.com/sighting.jpg"],
            });
        });

        it("mapea correctamente múltiples imágenes del avistamiento", () => {
            const sightingDetails = makeSightingDetails({
                imageUrls: [
                    "https://cdn.example.com/s1.jpg",
                    "https://cdn.example.com/s2.jpg",
                    "https://cdn.example.com/s3.jpg",
                ],
            });
            const report = makeReport({ details: sightingDetails });

            const result = MatchResultMapper.toDetailsReportDTO(report, undefined);

            expect(result?.images).toHaveLength(3);
        });
    });

    describe("cuando no hay pet ni SightingReportDetails", () => {
        it("retorna null si el reporte no tiene details compatibles", () => {
            const report = makeReport({ details: null });
            const result = MatchResultMapper.toDetailsReportDTO(report, undefined);
            expect(result).toBeNull();
        });

        it("retorna null si details no es instancia de SightingReportDetails", () => {

            const report = makeReport({ details: { animalType: "DOG", images: [] } });
            const result = MatchResultMapper.toDetailsReportDTO(report, undefined);
            expect(result).toBeNull();
        });
    });
});
