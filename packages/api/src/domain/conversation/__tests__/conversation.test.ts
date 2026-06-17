import { describe, it, expect } from "vitest";
import { Conversation } from "../Conversation";

describe("Conversation", () => {
  const validProps = {
    conversationId: 1,
    publicId: "conv-uuid-123",
    userOneId: 10,
    userTwoId: 20,
    createdAt: new Date("2026-06-16T10:00:00Z"),
  };

  describe("crear", () => {
    it("crea una Conversation con todas las propiedades", () => {
      const conversation = Conversation.create(validProps);

      expect(conversation.conversationId).toBe(1);
      expect(conversation.publicId).toBe("conv-uuid-123");
      expect(conversation.userOneId).toBe(10);
      expect(conversation.userTwoId).toBe(20);
      expect(conversation.createdAt).toEqual(new Date("2026-06-16T10:00:00Z"));
    });

    it("crea una Conversation sin conversationId (conversación nueva)", () => {
      const conversation = Conversation.create({
        ...validProps,
        conversationId: undefined,
      });

      expect(conversation.conversationId).toBeUndefined();
    });

    it("normaliza participantes para que userOneId < userTwoId", () => {
      const conversation = Conversation.create({
        ...validProps,
        userOneId: 20,
        userTwoId: 10,
      });

      expect(conversation.userOneId).toBe(10);
      expect(conversation.userTwoId).toBe(20);
    });

    it("no modifica participantes si ya están en orden", () => {
      const conversation = Conversation.create({
        ...validProps,
        userOneId: 5,
        userTwoId: 15,
      });

      expect(conversation.userOneId).toBe(5);
      expect(conversation.userTwoId).toBe(15);
    });
  });

  describe("hasParticipant", () => {
    it("retorna true cuando userId coincide con userOneId", () => {
      const conversation = Conversation.create(validProps);
      expect(conversation.hasParticipant(10)).toBe(true);
    });

    it("retorna true cuando userId coincide con userTwoId", () => {
      const conversation = Conversation.create(validProps);
      expect(conversation.hasParticipant(20)).toBe(true);
    });

    it("retorna false cuando userId no coincide con ningún participante", () => {
      const conversation = Conversation.create(validProps);
      expect(conversation.hasParticipant(99)).toBe(false);
    });
  });

  describe("getOtherParticipant", () => {
    it("retorna userTwoId cuando se llama con userOneId", () => {
      const conversation = Conversation.create(validProps);
      expect(conversation.getOtherParticipant(10)).toBe(20);
    });

    it("retorna userOneId cuando se llama con userTwoId", () => {
      const conversation = Conversation.create(validProps);
      expect(conversation.getOtherParticipant(20)).toBe(10);
    });

    it("lanza error cuando userId no es un participante", () => {
      const conversation = Conversation.create(validProps);
      expect(() => conversation.getOtherParticipant(99)).toThrow(
        "User is not part of this conversation"
      );
    });
  });
});
