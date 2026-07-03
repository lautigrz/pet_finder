import { PrismaClient } from "@prisma/client";
import { beforeAll, afterAll, beforeEach, describe, it, expect, inject } from "vitest";
import { truncateAll } from "@pet-alert/shared/testing";
import { PrismaMatchViewsRepository } from "../match-views.repository";
import { PrismaReportRepository } from "@infrastructure/repository/report/report.repository";
import { PrismaPetRepository } from "@infrastructure/repository/pet/pet.repository";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { Location } from "@domain/report/value-objects/location.vo";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { SightingImage } from "@domain/report/value-objects/sighting.images";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { PetImage } from "@domain/pet/value-objects/image.vo";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { MatchResultNotFoundError } from "@domain/errors/MatchResultNotFoundError";

let _imgCounter = 0;
function uniqueCloudId(): string {
    return `cloud-img-${Date.now()}-${++_imgCounter}`;
}

const NON_EXISTENT_UUID = "00000000-0000-0000-0000-000000000000";

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
        location: Location.create({ address: "Avenida siempre viva 742", latitude: 10, longitude: 20 }),
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
        petImage: [PetImage.create({ cloudinaryId: uniqueCloudId(), photoUrl: "https://example.com/pet.jpg" })],
    });
}


async function createMatchResult(
    prisma: PrismaClient,
    sourceReportId: number,
    candidateReportId: number,
) {
    return prisma.matchResult.create({
        data: {
            source_report_id: sourceReportId,
            candidate_report_id: candidateReportId,
            score: 0.85,
            image_score: 0.9,
            description_score: 0.7,
            structured_score: 0.8,
            shared_fields: 3,
        },
    });
}

describe("PrismaMatchViewsRepository (integration)", () => {
    let prisma: PrismaClient;
    let petRepository: PrismaPetRepository;
    let reportRepository: PrismaReportRepository;
    let repository: PrismaMatchViewsRepository;

    let userPublicId: string;
    let matchPublicId: string;

    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        petRepository = new PrismaPetRepository(prisma);
        reportRepository = new PrismaReportRepository(prisma);
        repository = new PrismaMatchViewsRepository(prisma);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await truncateAll(prisma);

        const owner = await prisma.user.create({
            data: { email: "owner@example.com", username: "owner", password: "hashed" },
        });
        userPublicId = owner.public_id;

        const sightingOwner = await prisma.user.create({
            data: { email: "sighting-owner@example.com", username: "sightingowner", password: "hashed" },
        });

        const pet = makePet(owner.user_id);
        await petRepository.save(pet);
        const savedPet = await prisma.pet.findFirst({ where: { user_id: owner.user_id } });

        const lostReport = Report.create({
            userId: owner.user_id,
            userPublicId: owner.public_id,
            type: ReportType.LOST,
            description: null,
            details: LostReportDetails.create({ petId: savedPet!.pet_id }),
            location: Location.create({ address: "Calle Falsa 123", latitude: -34.6, longitude: -58.4 }),
            occurredAt: new Date(),
        });
        const lostReportId = await reportRepository.save(lostReport);

        const sightingReport = makeSightingReport(sightingOwner.user_id);
        const sightingReportId = await reportRepository.save(sightingReport);

        const match = await createMatchResult(prisma, lostReportId, sightingReportId);
        matchPublicId = match.public_id;
    });

    describe("markSeen()", () => {
        it("crea un MatchView cuando el usuario ve el match por primera vez", async () => {
            await repository.markSeen(userPublicId, matchPublicId);

            const view = await prisma.matchView.findFirst({
                where: {
                    user: { public_id: userPublicId },
                    match_result: { public_id: matchPublicId },
                },
            });

            expect(view).not.toBeNull();
        });

        it("es idempotente: no crea duplicados si se llama más de una vez", async () => {
            await repository.markSeen(userPublicId, matchPublicId);
            await repository.markSeen(userPublicId, matchPublicId);

            const count = await prisma.matchView.count({
                where: {
                    user: { public_id: userPublicId },
                    match_result: { public_id: matchPublicId },
                },
            });

            expect(count).toBe(1);
        });

        it("lanza UserNotFoundError si el usuario no existe", async () => {
            await expect(
                repository.markSeen(NON_EXISTENT_UUID, matchPublicId)
            ).rejects.toThrow(UserNotFoundError);
        });

        it("lanza MatchResultNotFoundError si el match no existe", async () => {
            await expect(
                repository.markSeen(userPublicId, NON_EXISTENT_UUID)
            ).rejects.toThrow(MatchResultNotFoundError);
        });

        it("permite que distintos usuarios marquen el mismo match como visto", async () => {
            const user2 = await prisma.user.create({
                data: { email: "user2@example.com", username: "user2", password: "hashed" },
            });

            await repository.markSeen(userPublicId, matchPublicId);
            await repository.markSeen(user2.public_id, matchPublicId);

            const count = await prisma.matchView.count({
                where: { match_result: { public_id: matchPublicId } },
            });

            expect(count).toBe(2);
        });
    });


    describe("findSeenMatchPublicIdsByUser()", () => {
        it("devuelve los publicIds de los matches vistos por el usuario", async () => {
            await repository.markSeen(userPublicId, matchPublicId);

            const ids = await repository.findSeenMatchPublicIdsByUser(userPublicId);

            expect(ids).toHaveLength(1);
            expect(ids).toContain(matchPublicId);
        });

        it("devuelve lista vacía cuando el usuario no ha visto ningún match", async () => {
            const ids = await repository.findSeenMatchPublicIdsByUser(userPublicId);

            expect(ids).toHaveLength(0);
        });

        it("devuelve lista vacía para un usuario inexistente", async () => {
            const ids = await repository.findSeenMatchPublicIdsByUser(NON_EXISTENT_UUID);

            expect(ids).toHaveLength(0);
        });

        it("devuelve todos los matches vistos cuando el usuario ha visto varios", async () => {

            const owner2 = await prisma.user.create({
                data: { email: "owner2@example.com", username: "owner2", password: "hashed" },
            });
            const pet2 = makePet(owner2.user_id);
            await petRepository.save(pet2);
            const savedPet2 = await prisma.pet.findFirst({ where: { user_id: owner2.user_id } });

            const lostReport2 = Report.create({
                userId: owner2.user_id,
                userPublicId: owner2.public_id,
                type: ReportType.LOST,
                description: null,
                details: LostReportDetails.create({ petId: savedPet2!.pet_id }),
                location: Location.create({ address: "Otra calle 456", latitude: -34.7, longitude: -58.5 }),
                occurredAt: new Date(),
            });
            const lostReport2Id = await reportRepository.save(lostReport2);

            const sightingReport2 = makeSightingReport(owner2.user_id);
            const sightingReport2Id = await reportRepository.save(sightingReport2);

            const match2 = await createMatchResult(prisma, lostReport2Id, sightingReport2Id);

            await repository.markSeen(userPublicId, matchPublicId);
            await repository.markSeen(userPublicId, match2.public_id);

            const ids = await repository.findSeenMatchPublicIdsByUser(userPublicId);

            expect(ids).toHaveLength(2);
            expect(ids).toContain(matchPublicId);
            expect(ids).toContain(match2.public_id);
        });

        it("no incluye matches vistos por otros usuarios", async () => {
            const user2 = await prisma.user.create({
                data: { email: "user2@example.com", username: "user2", password: "hashed" },
            });

            await repository.markSeen(user2.public_id, matchPublicId);

            const ids = await repository.findSeenMatchPublicIdsByUser(userPublicId);

            expect(ids).toHaveLength(0);
        });
    });
});
