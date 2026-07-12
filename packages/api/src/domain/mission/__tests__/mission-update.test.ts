import { describe, it, expect } from "vitest";
import { MissionUpdate } from "@domain/mission/MissionUpdate";
import { InvalidFieldError } from "@domain/errors/InvalidFieldError";

describe("Entidad del Dominio MissionUpdate (Actualización de Misión)", () => {
  it("debe crear exitosamente una nueva actualización de misión con estado PENDING", () => {
    const update = MissionUpdate.create({
      missionId: 10,
      userId: 5,
      comment: "I saw the dog near the main gate.",
      photoUrl: "http://cloudinary.com/path/to/photo.jpg"
    });

    expect(update.updateId).toBeNull();
    expect(update.publicId).toBeDefined();
    expect(update.publicId).toHaveLength(36);
    expect(update.missionId).toBe(10);
    expect(update.userId).toBe(5);
    expect(update.comment).toBe("I saw the dog near the main gate.");
    expect(update.photoUrl).toBe("http://cloudinary.com/path/to/photo.jpg");
    expect(update.status).toBe("PENDING");
    expect(update.createdAt).toBeInstanceOf(Date);
  });

  it("debe lanzar InvalidFieldError si el comentario está vacío o es solo espacios en blanco", () => {
    expect(() => MissionUpdate.create({
      missionId: 10,
      userId: 5,
      comment: "",
      photoUrl: null
    })).toThrow(InvalidFieldError);

    expect(() => MissionUpdate.create({
      missionId: 10,
      userId: 5,
      comment: "   ",
      photoUrl: null
    })).toThrow(InvalidFieldError);
  });

  it("debe lanzar InvalidFieldError si el comentario es demasiado largo (más de 1000 caracteres)", () => {
    const longComment = "a".repeat(1001);
    expect(() => MissionUpdate.create({
      missionId: 10,
      userId: 5,
      comment: longComment,
      photoUrl: null
    })).toThrow(InvalidFieldError);
  });

  it("debe restaurar correctamente una actualización de misión", () => {
    const createdDate = new Date();
    const update = MissionUpdate.restore({
      updateId: 123,
      publicId: "custom-uuid",
      missionId: 10,
      userId: 5,
      comment: "Restored comment",
      photoUrl: null,
      status: "APPROVED",
      createdAt: createdDate,
      pointValue: null
    });

    expect(update.updateId).toBe(123);
    expect(update.publicId).toBe("custom-uuid");
    expect(update.comment).toBe("Restored comment");
    expect(update.photoUrl).toBeNull();
    expect(update.status).toBe("APPROVED");
    expect(update.createdAt).toBe(createdDate);
  });
});
