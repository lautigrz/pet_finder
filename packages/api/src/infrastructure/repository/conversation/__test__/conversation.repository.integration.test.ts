import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, inject } from "vitest";
import { PrismaConversationRepository } from "../conversation.repository";
import { Conversation } from "@domain/conversation/Conversation";
import { truncateAll } from "@pet-alert/shared/testing";
import { randomUUID } from "crypto";

const NON_EXISTENT_UUID = "00000000-0000-0000-0000-000000000000";
const NON_EXISTENT_ID = 999999;

describe("PrismaConversationRepository (integration)", () => {

    let prisma: PrismaClient;
    let repository: PrismaConversationRepository;
    let userOneId: number;
    let userTwoId: number;

    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        repository = new PrismaConversationRepository(prisma);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await truncateAll(prisma);

        const userOne = await prisma.user.create({
            data: { email: "userone@example.com", username: "userone", password: "hashed" },
        });
        const userTwo = await prisma.user.create({
            data: { email: "usertwo@example.com", username: "usertwo", password: "hashed" },
        });

        userOneId = userOne.user_id;
        userTwoId = userTwo.user_id;
    });

    function makeConversation(overrides: Partial<{ userOneId: number; userTwoId: number }> = {}): Conversation {
        return Conversation.create({
            publicId: randomUUID(),
            userOneId: overrides.userOneId ?? userOneId,
            userTwoId: overrides.userTwoId ?? userTwoId,
            createdAt: new Date(),
        });
    }

    describe("save()", () => {
        it("guarda una conversación y retorna la entidad con su id", async () => {
            const conversation = makeConversation();

            const saved = await repository.save(conversation);

            expect(saved).toBeDefined();
            expect(saved.conversationId).toBeDefined();
            expect(saved.publicId).toBe(conversation.publicId);
            expect(saved.userOneId).toBe(Math.min(userOneId, userTwoId));
            expect(saved.userTwoId).toBe(Math.max(userOneId, userTwoId));
        });

        it("normaliza los participantes (userOne siempre tiene el id menor)", async () => {
            const conversation = makeConversation({ userOneId: userTwoId, userTwoId: userOneId });

            const saved = await repository.save(conversation);

            expect(saved.userOneId).toBeLessThan(saved.userTwoId!);
        });
    });

    describe("findById()", () => {
        it("retorna la conversación por id interno", async () => {
            const saved = await repository.save(makeConversation());

            const found = await repository.findById(saved.conversationId!);

            expect(found).not.toBeNull();
            expect(found!.conversationId).toBe(saved.conversationId);
            expect(found!.publicId).toBe(saved.publicId);
        });

        it("retorna null cuando el id no existe", async () => {
            const found = await repository.findById(NON_EXISTENT_ID);
            expect(found).toBeNull();
        });
    });

    describe("findByPublicId()", () => {
        it("retorna la conversación por publicId", async () => {
            const saved = await repository.save(makeConversation());

            const found = await repository.findByPublicId(saved.publicId);

            expect(found).not.toBeNull();
            expect(found!.publicId).toBe(saved.publicId);
            expect(found!.conversationId).toBe(saved.conversationId);
        });

        it("retorna null cuando el publicId no existe", async () => {
            const found = await repository.findByPublicId(NON_EXISTENT_UUID);
            expect(found).toBeNull();
        });
    });

    describe("findByParticipants()", () => {
        it("retorna la conversación dado un par de participantes (orden normal)", async () => {
            await repository.save(makeConversation());

            const found = await repository.findByParticipants(userOneId, userTwoId);

            expect(found).not.toBeNull();
            expect(found!.userOneId).toBe(Math.min(userOneId, userTwoId));
            expect(found!.userTwoId).toBe(Math.max(userOneId, userTwoId));
        });

        it("retorna la conversación dado un par de participantes (orden inverso)", async () => {
            await repository.save(makeConversation());

            const found = await repository.findByParticipants(userTwoId, userOneId);

            expect(found).not.toBeNull();
        });

        it("retorna null cuando no existe conversación entre esos participantes", async () => {
            const found = await repository.findByParticipants(userOneId, userTwoId);
            expect(found).toBeNull();
        });
    });

    describe("findAllByUserId()", () => {
        it("retorna todas las conversaciones donde participa el usuario", async () => {
            const userThree = await prisma.user.create({
                data: { email: "userthree@example.com", username: "userthree", password: "hashed" },
            });

            await repository.save(makeConversation({ userOneId: userOneId, userTwoId: userTwoId }));
            await repository.save(makeConversation({ userOneId: userOneId, userTwoId: userThree.user_id }));

            const conversations = await repository.findAllByUserId(userOneId);

            expect(conversations).toHaveLength(2);
            conversations.forEach((c) => {
                expect(c.userOneId === userOneId || c.userTwoId === userOneId).toBe(true);
            });
        });

        it("retorna lista vacía si el usuario no tiene conversaciones", async () => {
            const conversations = await repository.findAllByUserId(userOneId);
            expect(conversations).toHaveLength(0);
        });

        it("retorna las conversaciones ordenadas por fecha de creación descendente", async () => {
            const userThree = await prisma.user.create({
                data: { email: "userthree@example.com", username: "userthree", password: "hashed" },
            });

            const older = await repository.save(Conversation.create({
                publicId: randomUUID(),
                userOneId: userOneId,
                userTwoId: userTwoId,
                createdAt: new Date(Date.now() - 10000),
            }));

            const newer = await repository.save(Conversation.create({
                publicId: randomUUID(),
                userOneId: userOneId,
                userTwoId: userThree.user_id,
                createdAt: new Date(Date.now()),
            }));

            const conversations = await repository.findAllByUserId(userOneId);

            expect(conversations).toHaveLength(2);
            expect(conversations[0]!.conversationId).toBe(newer.conversationId);
            expect(conversations[1]!.conversationId).toBe(older.conversationId);
        });
    });
});
