import prisma from "@infrastructure/prisma/prisma.client";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { MatchRepository } from "../match.repository";
import { truncateAll } from "@pet-alert/shared/testing";
import { randomUUID } from "crypto";

describe("MatchRepository (integration)", () => {
    let repository: MatchRepository;

    beforeAll(async () => {
        await prisma.$connect();
        repository = new MatchRepository(prisma);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await truncateAll(prisma);
    });

    describe("findMatchResults()", () => {
        it("retorna lista vacía si no hay coincidencias", async () => {
            const results = await repository.findMatchResults(999999);
            expect(results).toHaveLength(0);
        });

        it("retorna las coincidencias donde el reporte es origen o candidato", async () => {
            const user1 = await prisma.user.create({
                data: { email: "u1@example.com", username: "u1", password: "pwd", public_id: randomUUID() },
            });
            const user2 = await prisma.user.create({
                data: { email: "u2@example.com", username: "u2", password: "pwd", public_id: randomUUID() },
            });

            const report1 = await prisma.report.create({
                data: {
                    user_id: user1.user_id,
                    report_type_id: 1,
                    report_status_id: 1,
                    location_address: "Address 1",
                    public_id: randomUUID(),
                    occurred_at: new Date(),
                    created_at: new Date(),
                    location_lat: 0,
                    location_lng: 0,
                },
            });
            const report2 = await prisma.report.create({
                data: {
                    user_id: user2.user_id,
                    report_type_id: 2,
                    report_status_id: 1,
                    location_address: "Address 2",
                    public_id: randomUUID(),
                    occurred_at: new Date(),
                    created_at: new Date(),
                    location_lat: 0,
                    location_lng: 0,
                },
            });

            await prisma.matchResult.create({
                data: {
                    source_report_id: report1.report_id,
                    candidate_report_id: report2.report_id,
                    score: 0.85,
                    image_score: 0.9,
                    description_score: 0.8,
                    structured_score: 0.85,
                    shared_fields: 3,
                    public_id: randomUUID(),
                },
            });

            const resultsAsSource = await repository.findMatchResults(report1.report_id);
            expect(resultsAsSource).toHaveLength(1);
            expect(resultsAsSource[0]!.score).toBe(0.85);

            const resultsAsCandidate = await repository.findMatchResults(report2.report_id);
            expect(resultsAsCandidate).toHaveLength(1);
            expect(resultsAsCandidate[0]!.score).toBe(0.85);
        });
    });
});
