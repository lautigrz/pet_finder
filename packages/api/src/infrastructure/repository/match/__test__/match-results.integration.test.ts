import { MatchResultsEntity } from "@domain/match/entities/MatchResultsEntity";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { PetImage } from "@domain/pet/value-objects/image.vo";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { Location } from "@domain/report/value-objects/location.vo";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { SightingImage } from "@domain/report/value-objects/sighting.images";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";
import { PrismaPetRepository } from "@infrastructure/repository/pet/pet.repository";
import { PrismaReportRepository } from "@infrastructure/repository/report/report.repository";
import { PrismaClient } from "@prisma/client";
import { beforeAll, afterAll, beforeEach, describe, it, expect, inject } from "vitest";
import { PrismaMatchResultsRepository } from "../match-results.repository";
import { truncateAll } from "@pet-alert/shared/testing";


let _imgCounter = 0;
function uniqueCloudId(): string {
    return `cloud-img-${Date.now()}-${++_imgCounter}`;
}

const NON_EXISTENT_ID = 999999;

function makeSightingReport(userId: number): Report {
    return Report.create({
        userId,
        userPublicId: "irrelevant",
        type: ReportType.SIGHTING,
        description: null,
        details: SightingReportDetails.create({
            animalType: AnimalType.CAT,
            genderType: GenderType.MALE,
            sizeType: SizeType.MEDIUM,
            color: "Tricolor",
            breed: "Mestizo",
            hasIdCollar: false,
            isInTransit: false,
            images: [
                SightingImage.create({
                    cloudinaryId: uniqueCloudId(),
                    photoUrl: "https://example.com/photo.jpg",
                }),
            ],
        }),
        location: Location.create({
            address: "Avenida siempre viva 742",
            latitude: 10,
            longitude: 20,
        }),
        occurredAt: new Date(),
    });
}

function makePet(userId: number): Pet {
    return Pet.create({
        userId,
        name: "Firulais",
        animalType: AnimalType.CAT,
        genderType: GenderType.MALE,
        sizeType: SizeType.MEDIUM,
        color: "Negro",
        breed: "Mestizo",
        hasIdCollar: false,
        isVaccinated: false,
        petImage: [
            PetImage.create({
                cloudinaryId: uniqueCloudId(),
                photoUrl: "https://example.com/pet.jpg",
            }),
        ],
    });
}

async function createMatchResult(
    prisma: PrismaClient,
    sourceReportId: number,
    candidateReportId: number,
    score = 0.85,
) {
    return prisma.matchResult.create({
        data: {
            source_report_id: sourceReportId,
            candidate_report_id: candidateReportId,
            score,
            image_score: 0.9,
            description_score: 0.7,
            structured_score: 0.8,
            shared_fields: 3,
        },
    });
}


describe("PrismaMatchResultsRepository (integration)", () => {
    let prisma: PrismaClient;
    let petRepository: PrismaPetRepository;
    let reportRepository: PrismaReportRepository;
    let repository: PrismaMatchResultsRepository;

    let lostReportId: number;
    let sightingReportId: number;
    let ownerPublicId: string;

    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        petRepository = new PrismaPetRepository(prisma);
        reportRepository = new PrismaReportRepository(prisma);
        repository = new PrismaMatchResultsRepository(prisma);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await truncateAll(prisma);

        const owner = await prisma.user.create({
            data: { email: "owner@example.com", username: "owner", password: "hashed" },
        });
        ownerPublicId = owner.public_id;

        const pet = makePet(owner.user_id);
        await petRepository.save(pet);
        const savedPet = await prisma.pet.findFirst({ where: { user_id: owner.user_id } });

        const lostReport = Report.create({
            userId: owner.user_id,
            userPublicId: ownerPublicId,
            type: ReportType.LOST,
            description: null,
            details: LostReportDetails.create({ petId: savedPet!.pet_id }),
            location: Location.create({ address: "Calle Falsa 123 Buenos Aires", latitude: -34.6, longitude: -58.4 }),
            occurredAt: new Date(),
        });
        lostReportId = await reportRepository.save(lostReport);

        const sightingReport = makeSightingReport(owner.user_id);
        sightingReportId = await reportRepository.save(sightingReport);
    });



    describe("findById()", () => {
        it("devuelve la entidad correcta por id numérico", async () => {
            const row = await createMatchResult(prisma, lostReportId, sightingReportId, 0.85);

            const result = await repository.findById(row.match_result_id);

            expect(result).not.toBeNull();
            expect(result!.id).toBe(row.match_result_id);
            expect(result!.sourceReportId).toBe(lostReportId);
            expect(result!.candidateReportId).toBe(sightingReportId);
            expect(result!.score).toBeCloseTo(0.85);
            expect(result!.imageScore).toBeCloseTo(0.9);
            expect(result!.descriptionScore).toBeCloseTo(0.7);
        });

        it("devuelve null cuando el id no existe", async () => {
            const result = await repository.findById(NON_EXISTENT_ID);
            expect(result).toBeNull();
        });
    });

    describe("findResultsBySourceReportId()", () => {
        it("devuelve resultados donde el reporte es source", async () => {
            await createMatchResult(prisma, lostReportId, sightingReportId, 0.85);

            const results = await repository.findResultsBySourceReportId(lostReportId);

            expect(results).toHaveLength(1);
            expect(results[0]!.sourceReportId).toBe(lostReportId);
        });

        it("devuelve resultados donde el reporte es candidate", async () => {
            await createMatchResult(prisma, lostReportId, sightingReportId, 0.85);

            const results = await repository.findResultsBySourceReportId(sightingReportId);

            expect(results).toHaveLength(1);
            expect(results[0]!.candidateReportId).toBe(sightingReportId);
        });

        it("excluye resultados con score menor a 0.70", async () => {
            await createMatchResult(prisma, lostReportId, sightingReportId, 0.5);

            const results = await repository.findResultsBySourceReportId(lostReportId);

            expect(results).toHaveLength(0);
        });

        it("incluye exactamente scores >= 0.70", async () => {
            await createMatchResult(prisma, lostReportId, sightingReportId, 0.70);

            const results = await repository.findResultsBySourceReportId(lostReportId);

            expect(results).toHaveLength(1);
        });

        it("devuelve lista vacía cuando no hay matches para ese reporte", async () => {
            const results = await repository.findResultsBySourceReportId(lostReportId);
            expect(results).toHaveLength(0);
        });

        it("ordena los resultados por score descendente", async () => {
            const user2 = await prisma.user.create({
                data: { email: "user2@example.com", username: "user2", password: "hashed" },
            });
            const pet2 = makePet(user2.user_id);
            await petRepository.save(pet2);
            const savedPet2 = await prisma.pet.findFirst({ where: { user_id: user2.user_id } });

            const lostReport2 = Report.create({
                userId: user2.user_id,
                userPublicId: user2.public_id,
                type: ReportType.LOST,
                description: null,
                details: LostReportDetails.create({ petId: savedPet2!.pet_id }),
                location: Location.create({ address: "Calle Falsa 123 Buenos Aires", latitude: -34.6, longitude: -58.4 }),
                occurredAt: new Date(),
            });
            const lostReport2Id = await reportRepository.save(lostReport2);

            await createMatchResult(prisma, lostReportId, sightingReportId, 0.75);
            await createMatchResult(prisma, lostReport2Id, sightingReportId, 0.95);

            const results = await repository.findResultsBySourceReportId(sightingReportId);

            expect(results.length).toBeGreaterThanOrEqual(2);

            for (let i = 0; i < results.length - 1; i++) {
                expect(results[i]!.score).toBeGreaterThanOrEqual(results[i + 1]!.score);
            }
        });
    });


    describe("findNotificationsByUser()", () => {
        it("devuelve notificaciones cuando el usuario es dueño del reporte LOST", async () => {

            const sightingOwner = await prisma.user.create({
                data: { email: "sighting-owner@example.com", username: "sightingowner", password: "hashed" },
            });
            const sightingReport2 = makeSightingReport(sightingOwner.user_id);
            const sightingReport2Id = await reportRepository.save(sightingReport2);

            await createMatchResult(prisma, lostReportId, sightingReport2Id);

            const notifications = await repository.findNotificationsByUser(ownerPublicId);

            expect(notifications).toHaveLength(1);
            expect(notifications[0]!.rol).toBe("dueno");
            expect(notifications[0]!.ownerPublicId).toBe(ownerPublicId);
            expect(notifications[0]!.score).toBeCloseTo(0.85);
        });

        it("devuelve notificaciones cuando el usuario es avistador (dueño del SIGHTING)", async () => {

            const lostOwner = await prisma.user.create({
                data: { email: "lost-owner@example.com", username: "lostowner", password: "hashed" },
            });
            const pet2 = makePet(lostOwner.user_id);
            await petRepository.save(pet2);
            const savedPet2 = await prisma.pet.findFirst({ where: { user_id: lostOwner.user_id } });

            const lostReport2 = Report.create({
                userId: lostOwner.user_id,
                userPublicId: lostOwner.public_id,
                type: ReportType.LOST,
                description: null,
                details: LostReportDetails.create({ petId: savedPet2!.pet_id }),
                location: Location.create({ address: "Calle Falsa 123 Buenos Aires", latitude: -34.6, longitude: -58.4 }),
                occurredAt: new Date(),
            });
            const lostReport2Id = await reportRepository.save(lostReport2);

            await createMatchResult(prisma, lostReport2Id, sightingReportId);

            const notifications = await repository.findNotificationsByUser(ownerPublicId);

            expect(notifications).toHaveLength(1);
            expect(notifications[0]!.rol).toBe("avistador");
            expect(notifications[0]!.ownerPublicId).toBe(ownerPublicId);
        });

        it("devuelve lista vacía cuando no hay matches para ese usuario", async () => {
            const notifications = await repository.findNotificationsByUser(ownerPublicId);
            expect(notifications).toHaveLength(0);
        });

        it("no devuelve notificaciones cuando lost y sighting son del mismo usuario", async () => {
            await createMatchResult(prisma, lostReportId, sightingReportId);

            const notifications = await repository.findNotificationsByUser(ownerPublicId);

            expect(notifications).toHaveLength(0);
        });

        it("la notificación contiene los campos correctos", async () => {
            const sightingOwner = await prisma.user.create({
                data: { email: "sighting-owner@example.com", username: "sightingowner", password: "hashed" },
            });
            const sightingReport2 = makeSightingReport(sightingOwner.user_id);
            const sightingReport2Id = await reportRepository.save(sightingReport2);

            const matchRow = await createMatchResult(prisma, lostReportId, sightingReport2Id, 0.92);

            const notifications = await repository.findNotificationsByUser(ownerPublicId);

            expect(notifications).toHaveLength(1);
            const n = notifications[0]!;
            expect(n.matchPublicId).toBe(matchRow.public_id);
            expect(n.score).toBeCloseTo(0.92);
            expect(n.imageScore).toBeCloseTo(0.9);
            expect(n.descriptionScore).toBeCloseTo(0.7);
            expect(typeof n.createdAt).toBe("string");
            expect(n.lostReportPublicId).toBeDefined();
            expect(n.matchedReportPublicId).toBeDefined();
        });
    });
});