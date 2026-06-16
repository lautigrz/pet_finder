import { describe, it, expect } from "vitest";
import { ConversationOutputMapper } from "../conversation.mapper";
import { Conversation } from "@domain/conversation/Conversation";
import { Message } from "@domain/message/aggregate/MessageAgregate";
import { MessageText } from "@domain/message/value-objects/message.vo";
import { User } from "@domain/entities/User";

const HASH = "$2b$12$abcdefghijklmnopqrstuv.wxyzabcdefghijklmnopqrstuvwxyz12";

const makeUser = (id: number, pub: string, name: string): User =>
  User.reconstruct(id, pub, "t@t.com", name, HASH, true, new Date(), null, null, "photo.jpg");

describe("ConversationOutputMapper", () => {
  it("mapea conversación, usuarios y mensajes a ConversationOutput", () => {
    const conv = Conversation.create({ conversationId: 1, publicId: "conv-uuid", userOneId: 10, userTwoId: 20, createdAt: new Date("2026-01-01") });
    const currentUser = makeUser(10, "cur-uuid", "currentUser");
    const otherUser = makeUser(20, "other-uuid", "otherUser");
    const msg1 = Message.create({ messageId: 1, publicId: "m1", senderUserId: 10, receiverId: 20, conversationId: 1, text: MessageText.create("Hello"), isRead: true, createdAt: new Date("2026-01-01T10:00:00Z") });
    const msg2 = Message.create({ messageId: 2, publicId: "m2", senderUserId: 20, receiverId: 10, conversationId: 1, text: MessageText.create("Hi back"), isRead: false, createdAt: new Date("2026-01-01T10:01:00Z") });

    const result = ConversationOutputMapper.toOutput(conv, currentUser, otherUser, [msg1, msg2]);

    expect(result.publicId).toBe("conv-uuid");
    expect(result.otherUser.publicId).toBe("other-uuid");
    expect(result.otherUser.username).toBe("otherUser");
    expect(result.messages).toHaveLength(2);

    expect(result.messages[0]!.senderId).toBe("cur-uuid");

    expect(result.messages[1]!.senderId).toBe("other-uuid");
    expect(result.messages[0]!.text).toBe("Hello");
  });

  it("retorna array de mensajes vacío cuando no hay mensajes", () => {
    const conv = Conversation.create({ conversationId: 1, publicId: "conv-uuid", userOneId: 10, userTwoId: 20, createdAt: new Date() });
    const currentUser = makeUser(10, "cur-uuid", "cur");
    const otherUser = makeUser(20, "other-uuid", "other");

    const result = ConversationOutputMapper.toOutput(conv, currentUser, otherUser, []);
    expect(result.messages).toEqual([]);
  });
});
