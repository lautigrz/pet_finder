import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, inject } from "vitest";
import { PrismaMessageRepository } from "../message.repository";
import { Message, MessageProps } from "@domain/message/aggregate/MessageAgregate";
import { truncateAll } from "@pet-alert/shared/testing";
import { PrismaUserRepository } from "@infrastructure/repository/user/user.repository";
import { randomUUID } from "crypto";
import { MessageText } from "@domain/message/value-objects/message.vo";
import { PrismaConversationRepository } from "@infrastructure/repository/conversation/conversation.repository";
import { Conversation } from "@domain/conversation/Conversation";
import { MessageImage } from "@domain/message/value-objects/image.vo";





const NON_EXISTENT_UUID = "00000000-0000-0000-0000-000000000000";

function makeMessage(overrides: Partial<MessageProps> = {}): Message {

    return Message.create({
        publicId: randomUUID(),
        senderUserId: 1,
        receiverId: 2,
        conversationId: 1,
        text: MessageText.create("Hello"),
        isRead: false,
        createdAt: new Date(),
        images: [],
        ...overrides
    })
}




describe("PrismaMessageRepository", () => {

    let prisma: PrismaClient;
    let repository: PrismaMessageRepository;
    let userRepository: PrismaUserRepository;
    let conversationRepository: PrismaConversationRepository;
    let testUserOneId: number;
    beforeAll(async () => {
        const url = inject("testDatabaseUrl");
        prisma = new PrismaClient({ datasources: { db: { url } } });
        await prisma.$connect();
        repository = new PrismaMessageRepository(prisma);
        userRepository = new PrismaUserRepository(prisma);
        conversationRepository = new PrismaConversationRepository(prisma);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await truncateAll(prisma);

        const userOne = await prisma.user.create({
            data: {
                email: "userOne@example.com",
                username: "userOne",
                password: "hashed",
            },
        });

        testUserOneId = userOne.user_id;

    });

    describe("save()", () => {
        it("guarda un mensaje y retorna la entidad", async () => {

            const userTwo = await prisma.user.create({
                data: {
                    email: "userTwo@example.com",
                    username: "userTwo",
                    password: "hashed",
                },
            });

            const conversation = await conversationRepository.save(Conversation.create({
                publicId: randomUUID(),
                userOneId: testUserOneId,
                userTwoId: userTwo.user_id,
                createdAt: new Date()

            }))

            const message = makeMessage({
                conversationId: conversation.conversationId!,
                senderUserId: testUserOneId,
                receiverId: userTwo.user_id,
            })

            const savedMessage = await repository.save(message);

            expect(savedMessage).toBeInstanceOf(Message);
            expect(savedMessage.publicId).toBe(message.publicId);
            expect(savedMessage.senderUserId).toBe(message.senderUserId);
            expect(savedMessage.receiverUserId).toBe(message.receiverUserId);
            expect(savedMessage.conversationId).toBe(message.conversationId);
            expect(savedMessage.text.getValue()).toBe(message.text.getValue());
            expect(savedMessage.isRead).toBe(message.isRead);
            expect(savedMessage.createdAt).toEqual(message.createdAt);
            expect(savedMessage.image).toEqual(message.image);
        });

        it("guarda un mensaje con imagenes y retorna la entidad", async () => {

            const userTwo = await prisma.user.create({
                data: {
                    email: "userTwo@example.com",
                    username: "userTwo",
                    password: "hashed",
                },
            });

            const conversation = await conversationRepository.save(Conversation.create({
                publicId: randomUUID(),
                userOneId: testUserOneId,
                userTwoId: userTwo.user_id,
                createdAt: new Date()

            }))

            const message = makeMessage({
                conversationId: conversation.conversationId!,
                senderUserId: testUserOneId,
                receiverId: userTwo.user_id,
                images: [
                    MessageImage.create({
                        imageId: null,
                        publicId: randomUUID(),
                        url: "https://example.com/image.jpg"
                    }),
                    MessageImage.create({
                        imageId: null,
                        publicId: randomUUID(),
                        url: "https://example.com/image.jpg"
                    })
                ]
            })

            const savedMessage = await repository.save(message);

            expect(savedMessage).toBeInstanceOf(Message);
            expect(savedMessage.publicId).toBe(message.publicId);
            expect(savedMessage.senderUserId).toBe(message.senderUserId);
            expect(savedMessage.receiverUserId).toBe(message.receiverUserId);
            expect(savedMessage.conversationId).toBe(message.conversationId);
            expect(savedMessage.text.getValue()).toBe(message.text.getValue());
            expect(savedMessage.isRead).toBe(message.isRead);
            expect(savedMessage.createdAt).toEqual(message.createdAt);
            expect(savedMessage.image.length).toEqual(message.image.length);
            expect(savedMessage.image[0]!.publicId).toEqual(message.image[0]!.publicId);
            expect(savedMessage.image[0]!.url).toEqual(message.image[0]!.url);
            expect(savedMessage.image[1]!.publicId).toEqual(message.image[1]!.publicId);
            expect(savedMessage.image[1]!.url).toEqual(message.image[1]!.url);
        });
    });

    describe("findById", () => {
        it("retorna un mensaje por su ID", async () => {
            const userTwo = await prisma.user.create({
                data: {
                    email: "userTwo@example.com",
                    username: "userTwo",
                    password: "hashed",
                },
            });


            const conversation = await conversationRepository.save(Conversation.create({
                publicId: randomUUID(),
                userOneId: testUserOneId,
                userTwoId: userTwo.user_id,
                createdAt: new Date()

            }))

            const message = await repository.save(makeMessage({
                conversationId: conversation.conversationId!,
                senderUserId: testUserOneId,
                receiverId: userTwo.user_id,
            }));

            const result = await repository.findById(message.messageId!);

            expect(result!.messageId).toBe(message.messageId);
            expect(result!.publicId).toBe(message.publicId);
            expect(result!.senderUserId).toBe(message.senderUserId);
            expect(result!.receiverUserId).toBe(message.receiverUserId);
            expect(result!.conversationId).toBe(message.conversationId);
            expect(result!.text.getValue()).toBe(message.text.getValue());
            expect(result!.isRead).toBe(message.isRead);
            expect(result!.createdAt).toEqual(message.createdAt);
            expect(result!.image).toEqual(message.image);
        });

        it("retorna null si no encuentra el mensaje", async () => {
            const result = await repository.findById(100000);
            expect(result).toBeNull();
        });
    });

    describe("findByPublicId", () => {
        it("retorna un mensaje por su public id", async () => {
            const userTwo = await prisma.user.create({
                data: {
                    email: "userTwo@example.com",
                    username: "userTwo",
                    password: "hashed",
                },
            });


            const conversation = await conversationRepository.save(Conversation.create({
                publicId: randomUUID(),
                userOneId: testUserOneId,
                userTwoId: userTwo.user_id,
                createdAt: new Date()

            }))

            const message = await repository.save(makeMessage({
                conversationId: conversation.conversationId!,
                senderUserId: testUserOneId,
                receiverId: userTwo.user_id,
            }));

            const result = await repository.findByPublicId(message.publicId);

            expect(result!.messageId).toBe(message.messageId);
            expect(result!.publicId).toBe(message.publicId);
            expect(result!.senderUserId).toBe(message.senderUserId);
            expect(result!.receiverUserId).toBe(message.receiverUserId);
            expect(result!.conversationId).toBe(message.conversationId);
            expect(result!.text.getValue()).toBe(message.text.getValue());
            expect(result!.isRead).toBe(message.isRead);
            expect(result!.createdAt).toEqual(message.createdAt);
            expect(result!.image).toEqual(message.image);

        });

        it("retorna null si no encuentra el mensaje", async () => {
            const result = await repository.findByPublicId(NON_EXISTENT_UUID);
            expect(result).toBeNull();
        });
    });

    describe("findByConversationId", () => {
        it("retorna los mensajes de una conversacion", async () => {

            const userTwo = await prisma.user.create({
                data: {
                    email: "userTwo@example.com",
                    username: "userTwo",
                    password: "hashed",
                },
            });


            const conversation = await conversationRepository.save(Conversation.create({
                publicId: randomUUID(),
                userOneId: testUserOneId,
                userTwoId: userTwo.user_id,
                createdAt: new Date()

            }))

            const message = await repository.save(makeMessage({
                conversationId: conversation.conversationId!,
                senderUserId: testUserOneId,
                receiverId: userTwo.user_id,
            }));

            const pagination = await repository.findByConversationId(conversation.conversationId!, { page: 1, limit: 10 });

            expect(pagination.items).toHaveLength(1);
            expect(pagination.items[0]).toEqual(message);
            expect(pagination.total).toBe(1);
        });

        it("retorna los mensaje ordenados de manera asc", async () => {

            const userTwo = await prisma.user.create({
                data: {
                    email: "userTwo@example.com",
                    username: "userTwo",
                    password: "hashed",
                },
            });


            const conversation = await conversationRepository.save(Conversation.create({
                publicId: randomUUID(),
                userOneId: testUserOneId,
                userTwoId: userTwo.user_id,
                createdAt: new Date()

            }))

            const messageOne = await repository.save(makeMessage({
                conversationId: conversation.conversationId!,
                senderUserId: testUserOneId,
                receiverId: userTwo.user_id,
                createdAt: new Date(Date.now() - 3000)
            }));

            const messageTwo = await repository.save(makeMessage({
                conversationId: conversation.conversationId!,
                senderUserId: userTwo.user_id,
                receiverId: testUserOneId,
                createdAt: new Date(Date.now() - 2000)
            }));

            const messageThree = await repository.save(makeMessage({
                conversationId: conversation.conversationId!,
                senderUserId: testUserOneId,
                receiverId: userTwo.user_id,
                createdAt: new Date(Date.now() - 1000)
            }));

            const messageFour = await repository.save(makeMessage({
                conversationId: conversation.conversationId!,
                senderUserId: userTwo.user_id,
                receiverId: testUserOneId,
                createdAt: new Date(Date.now())
            }));

            const pagination = await repository.findByConversationId(conversation.conversationId!, { page: 1, limit: 10 });

            expect(pagination.items).toHaveLength(4);
            expect(pagination.items[0]).toEqual(messageOne);
            expect(pagination.items[1]).toEqual(messageTwo);
            expect(pagination.items[2]).toEqual(messageThree);
            expect(pagination.items[3]).toEqual(messageFour);
            expect(pagination.total).toBe(4);

        })

        it("retorna null si no encuentra los mensajes", async () => {
            const pagination = await repository.findByConversationId(1, { page: 1, limit: 10 });
            expect(pagination.items).toHaveLength(0);
            expect(pagination.total).toBe(0);
        });
    });

});