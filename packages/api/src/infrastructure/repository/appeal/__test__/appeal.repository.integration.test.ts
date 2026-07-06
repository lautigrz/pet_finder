import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, inject } from "vitest";
import { PrismaAppealRepository } from "../appeal.repository";
import { Appeal } from "@domain/appeal/Appeal";
import { AppealStatus } from "@domain/appeal/types/appeal-status";
import { AppealTargetType } from "@domain/appeal/types/appeal-target-type";
import { truncateAll } from "@pet-alert/shared/testing";
import { randomUUID } from "crypto";

describe("PrismaAppealRepository (integration)", () => {

    let prisma: PrismaClient;
    let repository: PrismaAppealRepository;
    let appellantUserId: number;
    let targetPublicId: string;

    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        repository = new PrismaAppealRepository(prisma);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await truncateAll(prisma);
        const appellant = await prisma.user.create({
            data: { email: "owner@example.com", username: "owner", password: "hashed" },
        });
        appellantUserId = appellant.user_id;
        targetPublicId = randomUUID();
    });

    function makeAppeal(): Appeal {
        return Appeal.create({
            publicId: randomUUID(),
            appellantUserId,
            targetType: AppealTargetType.POST,
            targetPublicId,
            message: "Mi defensa",
        });
    }

    it("guarda y recupera una apelación por publicId", async () => {
        const appeal = makeAppeal();

        await repository.save(appeal);
        const found = await repository.findByPublicId(appeal.publicId);

        expect(found?.message).toBe("Mi defensa");
        expect(found?.status).toBe(AppealStatus.PENDING);
        expect(found?.targetType).toBe(AppealTargetType.POST);
        expect(found?.appellantUserId).toBe(appellantUserId);
    });

    it("existsForTarget detecta el caso ya apelado", async () => {
        expect(await repository.existsForTarget(AppealTargetType.POST, targetPublicId)).toBe(false);

        await repository.save(makeAppeal());

        expect(await repository.existsForTarget(AppealTargetType.POST, targetPublicId)).toBe(true);
    });

    it("no permite dos apelaciones para el mismo caso (unique)", async () => {
        await repository.save(makeAppeal());

        await expect(repository.save(makeAppeal())).rejects.toThrow();
    });

    it("update persiste el estado y la fecha de resolución", async () => {
        const appeal = makeAppeal();
        await repository.save(appeal);

        appeal.accept();
        await repository.update(appeal);

        const found = await repository.findByPublicId(appeal.publicId);
        expect(found?.status).toBe(AppealStatus.ACCEPTED);
        expect(found?.resolvedAt).not.toBeNull();
    });

    it("findQueueByStatus trae las pendientes con el apelante", async () => {
        await repository.save(makeAppeal());

        const queue = await repository.findQueueByStatus(AppealStatus.PENDING);

        expect(queue).toHaveLength(1);
        expect(queue[0]!.appellant.username).toBe("owner");
        expect(queue[0]!.appeal.message).toBe("Mi defensa");
    });
});
