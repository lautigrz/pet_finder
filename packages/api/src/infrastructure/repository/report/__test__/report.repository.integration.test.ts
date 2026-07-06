import { PrismaClient } from "@prisma/client";
import { beforeAll, afterAll, beforeEach, describe, it, expect, inject } from "vitest";
import { PrismaReportRepository } from "@infrastructure/repository/report/report.repository";
import { truncateAll } from "@pet-alert/shared/testing";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { Location } from "@domain/report/value-objects/location.vo";
import { SightingImage } from "@domain/report/value-objects/sighting.images";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { ReportType } from "@domain/report/types/report.type";
import { ReportStatus } from "@domain/report/types/report.status";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";
import { PrismaPetRepository } from "@infrastructure/repository/pet/pet.repository";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { PetImage } from "@domain/pet/value-objects/image.vo";
import { ReportQuery } from "@application/usecase/report-usecase/report-query";


let _imgCounter = 0;
function uniqueCloudId(): string {
    return `cloud-img-${Date.now()}-${++_imgCounter}`;
}

const NON_EXISTENT_UUID = "00000000-0000-0000-0000-000000000000";

function makeSightingReport(userId: number, overrides: Partial<{
    color: string;
    animalType: AnimalType;
    genderType: GenderType;
    sizeType: SizeType;
    breed: string;
    hasIdCollar: boolean;
    isInTransit: boolean;
    description: string | null;
    latitude: number;
    longitude: number;
    occurredAt: Date;
}> = {}): Report {
    return Report.create({
        userId,
        userPublicId: "user-public-123",
        type: ReportType.SIGHTING,
        description: null,
        details: SightingReportDetails.create({
            animalType: overrides.animalType ?? AnimalType.CAT,
            genderType: overrides.genderType ?? GenderType.MALE,
            sizeType: overrides.sizeType ?? SizeType.MEDIUM,
            color: overrides.color ?? "Tricolor",
            breed: overrides.breed ?? "Mestizo",
            hasIdCollar: overrides.hasIdCollar ?? false,
            isInTransit: overrides.isInTransit ?? false,
            images: [
                SightingImage.create({
                    cloudinaryId: uniqueCloudId(),
                    photoUrl: "https://example.com/photo.jpg",
                }),
            ],
        }),
        location: Location.create({
            address: "Avenida siempre viva 742",
            latitude: overrides.latitude ?? 10,
            longitude: overrides.longitude ?? 20,
        }),
        occurredAt: overrides.occurredAt ?? new Date(),
    });
}


describe("PrismaReportRepository (integration)", () => {
    let prisma: PrismaClient;
    let repository: PrismaReportRepository;
    let petRepository: PrismaPetRepository;
    let testUserId: number;
    let testUserPublicId: string;

    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        repository = new PrismaReportRepository(prisma);
        petRepository = new PrismaPetRepository(prisma);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await truncateAll(prisma);

        const user = await prisma.user.create({
            data: {
                email: "test-user@example.com",
                username: "testuser",
                password: "hashed-password",
            },
        });
        testUserId = user.user_id;
        testUserPublicId = user.public_id;
    });

    describe("save()", () => {
        it("persiste un reporte SIGHTING completo con ubicación, detalles e imágenes", async () => {
            const report = makeSightingReport(testUserId);

            const savedId = await repository.save(report);

            const row = await prisma.report.findFirst({
                where: { report_id: savedId },
                include: {
                    sighting_report_detail: {
                        include: {
                            animal_type: true,
                            size: true,
                            breed: true,
                            color: true,
                            gender: true,
                        },
                    },
                    reportImages: true,
                },
            });

            expect(savedId).toBeDefined();
            expect(typeof savedId).toBe("number");
            expect(row).not.toBeNull();


            expect(row!.location_lat?.toNumber()).toBe(10);
            expect(row!.location_lng?.toNumber()).toBe(20);
            expect(row!.location_address).toBe("Avenida siempre viva 742");


            expect(row!.sighting_report_detail?.animal_type?.name).toBe("CAT");
            expect(row!.sighting_report_detail?.size?.name).toBe("MEDIUM");
            expect(row!.sighting_report_detail?.breed?.name).toBe("Mestizo");
            expect(row!.sighting_report_detail?.color?.name).toBe("Tricolor");
            expect(row!.sighting_report_detail?.gender?.name).toBe("MALE");
            expect(row!.sighting_report_detail?.has_id_collar).toBe(false);
            expect(row!.sighting_report_detail?.is_in_transit).toBe(false);


            expect(row!.reportImages).toHaveLength(1);
            expect(row!.reportImages[0]!.cloudinaryId).toMatch(/^cloud-img-/);
            expect(row!.reportImages[0]!.photoUrl).toBe("https://example.com/photo.jpg");
        });

        it("persiste un reporte LOST vinculado a una mascota existente", async () => {

            const pet = Pet.create({
                userId: testUserId,
                name: "Firulais",
                animalType: AnimalType.DOG,
                genderType: GenderType.MALE,
                sizeType: SizeType.LARGE,
                color: "Negro",
                hasIdCollar: true,
                isVaccinated: true,
                breed: "Labrador",
                petImage: [PetImage.create({ cloudinaryId: "pet-img-001", photoUrl: "https://example.com/pet.jpg" })],
            });
            await petRepository.save(pet);

            const savedPet = await prisma.pet.findFirst({ where: { user_id: testUserId } });
            expect(savedPet).not.toBeNull();

            const report = Report.create({
                userId: testUserId,
                userPublicId: testUserPublicId,
                type: ReportType.LOST,
                description: null,
                details: LostReportDetails.create({ petId: savedPet!.pet_id }),
                location: Location.create({ address: "Calle Falsa 123 Buenos Aires", latitude: -34.6, longitude: -58.4 }),
                occurredAt: new Date(),
            });

            const savedId = await repository.save(report);

            const row = await prisma.report.findFirst({
                where: { report_id: savedId },
                include: { lost_report_detail: true },
            });

            expect(savedId).toBeDefined();
            expect(row).not.toBeNull();
            expect(row!.lost_report_detail?.pet_id).toBe(savedPet!.pet_id);
            expect(row!.report_type_id).toBe(1); // LOST
        });
    });



    describe("findByPublicId()", () => {
        it("devuelve el reporte correcto por publicId", async () => {
            const report = makeSightingReport(testUserId);
            await repository.save(report);

            const found = await repository.findByPublicId(report.publicId);

            expect(found).not.toBeNull();
            expect(found!.publicId).toBe(report.publicId);
            expect(found!.reportType).toBe(ReportType.SIGHTING);
            expect(found!.status).toBe(ReportStatus.ACTIVE);
            expect(found!.location.address).toBe("Avenida siempre viva 742");
        });

        it("devuelve null cuando el publicId no existe", async () => {
            const found = await repository.findByPublicId(NON_EXISTENT_UUID);
            expect(found).toBeNull();
        });
    });

    describe("findDetailByPublicId()", () => {
        it("devuelve el detalle de un reporte SIGHTING con el report anidado", async () => {
            const report = makeSightingReport(testUserId, { color: "Naranja", breed: "Siamés" });
            await repository.save(report);

            const result = await repository.findDetailByPublicId(report.publicId);

            expect(result).not.toBeNull();
            expect(result!.report.publicId).toBe(report.publicId);
            expect(result!.pet).toBeUndefined();
        });

        it("devuelve null para un publicId inexistente", async () => {
            const result = await repository.findDetailByPublicId(NON_EXISTENT_UUID);
            expect(result).toBeNull();
        });
    });



    describe("findByUserPublicId()", () => {
        it("devuelve todos los reportes del usuario cuando no hay filtros", async () => {
            await repository.save(makeSightingReport(testUserId, { animalType: AnimalType.CAT }));
            await repository.save(makeSightingReport(testUserId, { animalType: AnimalType.DOG }));

            const results = await repository.findByUserPublicId(testUserPublicId);
            expect(results).toHaveLength(2);
        });

        it("filtra por reportType", async () => {
            await repository.save(makeSightingReport(testUserId));

            const results = await repository.findByUserPublicId(testUserPublicId, {
                reportType: "SIGHTING",
            });
            expect(results).toHaveLength(1);
            expect(results[0]!.reportType).toBe(ReportType.SIGHTING);
        });

        it("filtra por animalType", async () => {
            await repository.save(makeSightingReport(testUserId, { animalType: AnimalType.CAT }));
            await repository.save(makeSightingReport(testUserId, { animalType: AnimalType.DOG }));

            const catResults = await repository.findByUserPublicId(testUserPublicId, {
                animalType: "CAT",
            });
            expect(catResults).toHaveLength(1);
        });

        it("devuelve lista vacía cuando el usuario no tiene reportes", async () => {
            const results = await repository.findByUserPublicId(NON_EXISTENT_UUID);
            expect(results).toHaveLength(0);
        });
    });


    describe("findIdsByQuery()", () => {
        it("devuelve los publicIds de todos los reportes sin filtros", async () => {
            const r1 = makeSightingReport(testUserId);
            const r2 = makeSightingReport(testUserId);
            await repository.save(r1);
            await repository.save(r2);

            const ids = await repository.findIdsByQuery(new ReportQuery({}));
            expect(ids.length).toBeGreaterThanOrEqual(2);
        });

        it("filtra por status", async () => {
            const r1 = makeSightingReport(testUserId);
            const reportId = await repository.save(r1);

            const saved = await repository.findByPublicId(r1.publicId);
            saved!.resolve(true);
            await repository.update(saved!);
            const ids = await repository.findIdsByQuery(new ReportQuery({ status: "RESOLVED" }));
            expect(ids).toContain(r1.publicId);

            const activeIds = await repository.findIdsByQuery(new ReportQuery({ status: "ACTIVE" }));
            expect(activeIds).not.toContain(r1.publicId);
        });

        it("filtra por userPublicId", async () => {
            const r1 = makeSightingReport(testUserId);
            await repository.save(r1);

            const ids = await repository.findIdsByQuery(new ReportQuery({ userPublicId: testUserPublicId }));
            expect(ids).toContain(r1.publicId);

            const empty = await repository.findIdsByQuery(new ReportQuery({ userPublicId: NON_EXISTENT_UUID }));
            expect(empty).toHaveLength(0);
        });

        it("filtra por reportType", async () => {
            const r1 = makeSightingReport(testUserId);
            await repository.save(r1);

            const sightingIds = await repository.findIdsByQuery(new ReportQuery({ reportType: "SIGHTING" }));
            expect(sightingIds).toContain(r1.publicId);

            const lostIds = await repository.findIdsByQuery(new ReportQuery({ reportType: "LOST" }));
            expect(lostIds).not.toContain(r1.publicId);
        });
    });

    describe("findByIds()", () => {
        it("devuelve reportes correspondientes a los publicIds dados", async () => {
            const r1 = makeSightingReport(testUserId);
            const r2 = makeSightingReport(testUserId);
            await repository.save(r1);
            await repository.save(r2);

            const results = await repository.findByIds([r1.publicId, r2.publicId]);
            expect(results).toHaveLength(2);
            const publicIds = results.map(r => r.report.publicId);
            expect(publicIds).toContain(r1.publicId);
            expect(publicIds).toContain(r2.publicId);
        });

        it("devuelve lista vacía cuando no hay ids coincidentes", async () => {
            const results = await repository.findByIds([NON_EXISTENT_UUID]);
            expect(results).toHaveLength(0);
        });

        it("devuelve lista vacía cuando el array de ids está vacío", async () => {
            const results = await repository.findByIds([]);
            expect(results).toHaveLength(0);
        });
    });

    describe("findDetailsByIds()", () => {
        it("devuelve reportes con detalles por ids numéricos", async () => {
            const r1 = makeSightingReport(testUserId);
            const savedId = await repository.save(r1);

            const results = await repository.findDetailsByIds([savedId]);

            expect(results).toHaveLength(1);
            expect(results[0]!.report.publicId).toBe(r1.publicId);
        });

        it("devuelve lista vacía si ningún id coincide", async () => {
            const results = await repository.findDetailsByIds([999999]);
            expect(results).toHaveLength(0);
        });
    });

    describe("update()", () => {
        it("actualiza el status del reporte a RESOLVED", async () => {
            const report = makeSightingReport(testUserId);
            const savedId = await repository.save(report);

            const saved = await repository.findByPublicId(report.publicId);
            expect(saved!.status).toBe(ReportStatus.ACTIVE);

            saved!.resolve(true);
            await repository.update(saved!);

            const updated = await prisma.report.findFirst({ where: { report_id: savedId } });
            expect(updated!.report_status_id).toBe(2); // RESOLVED
        });

        it("actualiza el status del reporte a CLOSED", async () => {
            const report = makeSightingReport(testUserId);
            const savedId = await repository.save(report);

            const saved = await repository.findByPublicId(report.publicId);
            saved!.resolve(true);
            await repository.update(saved!);

            const afterResolve = await repository.findByPublicId(report.publicId);
            afterResolve!.close();
            await repository.update(afterResolve!);

            const row = await prisma.report.findFirst({ where: { report_id: savedId } });
            expect(row!.report_status_id).toBe(3); // CLOSED
        });

        it("lanza error si el reporte no tiene id", async () => {
            const report = makeSightingReport(testUserId); // sin guardar → idReport null
            await expect(repository.update(report)).rejects.toThrow("Report ID is required");
        });
    });

    describe("findImagesByReportId()", () => {
        it("devuelve las imágenes de un reporte SIGHTING por publicId", async () => {
            const report = makeSightingReport(testUserId);
            await repository.save(report);

            const images = await repository.findImagesByReportId(report.publicId);

            expect(images).toHaveLength(1);
            expect(images[0]!.cloudinaryId).toMatch(/^cloud-img-/);
            expect(images[0]!.photoUrl).toBe("https://example.com/photo.jpg");
        });

        it("devuelve lista vacía para un publicId inexistente", async () => {
            const images = await repository.findImagesByReportId(NON_EXISTENT_UUID);
            expect(images).toHaveLength(0);
        });
    });

    describe("updateFields()", () => {
        it("actualiza la ubicación de un reporte SIGHTING", async () => {
            const report = makeSightingReport(testUserId);
            const savedId = await repository.save(report);

            const saved = await repository.findByPublicId(report.publicId);
            saved!.updateFields({
                location: Location.create({
                    address: "Nueva Dirección Actualizada 999",
                    latitude: -34.9,
                    longitude: -57.1,
                }),
            });

            await repository.updateFields(saved!);

            const row = await prisma.report.findFirst({ where: { report_id: savedId } });
            expect(row!.location_address).toBe("Nueva Dirección Actualizada 999");
            expect(row!.location_lat?.toNumber()).toBeCloseTo(-34.9, 2);
            expect(row!.location_lng?.toNumber()).toBeCloseTo(-57.1, 2);
        });

        it("agrega nuevas imágenes a un reporte SIGHTING", async () => {
            const report = makeSightingReport(testUserId);
            await repository.save(report);
            const existingImages = await prisma.reportImage.findMany({
                where: { report: { public_id: report.publicId } },
            });
            const existingId = existingImages[0]!.cloudinaryId;

            const saved = await repository.findByPublicId(report.publicId);
            const newImages = [
                SightingImage.create({ cloudinaryId: existingId, photoUrl: "https://example.com/photo.jpg" }),
                SightingImage.create({ cloudinaryId: uniqueCloudId(), photoUrl: "https://example.com/photo2.jpg" }),
            ];

            await repository.updateFields(saved!, newImages);

            const images = await prisma.reportImage.findMany({
                where: { report: { public_id: report.publicId } },
            });
            expect(images).toHaveLength(2);
        });

        it("elimina imágenes que ya no están en la lista de un reporte SIGHTING", async () => {
            const report = makeSightingReport(testUserId);
            await repository.save(report);

            const saved = await repository.findByPublicId(report.publicId);

            const newImages = [
                SightingImage.create({ cloudinaryId: uniqueCloudId(), photoUrl: "https://example.com/new.jpg" }),
            ];

            await repository.updateFields(saved!, newImages);

            const images = await prisma.reportImage.findMany({
                where: { report: { public_id: report.publicId } },
            });
            expect(images).toHaveLength(1);
            expect(images[0]!.photoUrl).toBe("https://example.com/new.jpg");
        });

        it("actualiza los detalles de color y raza de un reporte SIGHTING", async () => {
            const report = makeSightingReport(testUserId, { color: "Tricolor", breed: "Mestizo" });
            const savedId = await repository.save(report);

            const saved = await repository.findByPublicId(report.publicId);
            const updatedDetails = SightingReportDetails.create({
                animalType: AnimalType.DOG,
                genderType: GenderType.FEMALE,
                sizeType: SizeType.SMALL,
                color: "Marrón",
                breed: "Labrador",
                hasIdCollar: true,
                isInTransit: true,
                images: [SightingImage.create({ cloudinaryId: uniqueCloudId(), photoUrl: "https://example.com/photo.jpg" })],
            });

            saved!.updateFields({ details: updatedDetails });
            await repository.updateFields(saved!);

            const row = await prisma.report.findFirst({
                where: { report_id: savedId },
                include: {
                    sighting_report_detail: {
                        include: { color: true, breed: true, animal_type: true, gender: true, size: true },
                    },
                },
            });

            expect(row!.sighting_report_detail?.color?.name).toBe("Marrón");
            expect(row!.sighting_report_detail?.breed?.name).toBe("Labrador");
            expect(row!.sighting_report_detail?.animal_type?.name).toBe("DOG");
            expect(row!.sighting_report_detail?.gender?.name).toBe("FEMALE");
            expect(row!.sighting_report_detail?.size?.name).toBe("SMALL");
            expect(row!.sighting_report_detail?.has_id_collar).toBe(true);
            expect(row!.sighting_report_detail?.is_in_transit).toBe(true);
        });
    });
});