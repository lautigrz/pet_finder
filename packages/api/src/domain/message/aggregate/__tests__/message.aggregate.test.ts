import { describe, it, expect } from "vitest";
import { Message } from "../MessageAgregate";
import { MessageText } from "../../value-objects/message.vo";
import { MessageImage } from "../../value-objects/image.vo";

describe("Message", () => {
  const validProps = {
    messageId: 1,
    publicId: "msg-uuid-123",
    senderUserId: 10,
    receiverId: 20,
    conversationId: 5,
    text: MessageText.create("Hola, vi a tu mascota"),
    isRead: false,
    createdAt: new Date("2026-06-16T10:00:00Z"),
    images: [],
  };

  it("crea un Message con todas las propiedades", () => {
    const message = Message.create(validProps);

    expect(message.messageId).toBe(1);
    expect(message.publicId).toBe("msg-uuid-123");
    expect(message.senderUserId).toBe(10);
    expect(message.receiverUserId).toBe(20);
    expect(message.conversationId).toBe(5);
    expect(message.text.getValue()).toBe("Hola, vi a tu mascota");
    expect(message.isRead).toBe(false);
    expect(message.createdAt).toEqual(new Date("2026-06-16T10:00:00Z"));
    expect(message.image).toEqual([]);
  });

  it("crea un Message sin messageId (mensaje nuevo)", () => {
    const message = Message.create({
      ...validProps,
      messageId: undefined,
    });

    expect(message.messageId).toBeUndefined();
    expect(message.publicId).toBe("msg-uuid-123");
  });

  it("crea un Message con imágenes asociadas", () => {
    const img = MessageImage.create({
      imageId: 1,
      publicId: "img-uuid",
      url: "https://example.com/imagen.jpg",
    });

    const message = Message.create({
      ...validProps,
      images: [img],
    });

    expect(message.image).toHaveLength(1);
    expect(message.image[0]!.imageId).toBe(1);
    expect(message.image[0]!.publicId).toBe("img-uuid");
    expect(message.image[0]!.url).toBe("https://example.com/imagen.jpg");
  });
});
