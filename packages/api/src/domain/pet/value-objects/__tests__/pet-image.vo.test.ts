import { describe, it, expect } from "vitest";
import { PetImage } from "../image.vo";

describe("PetImage", () => {
  describe("create", () => {
    it("crea una PetImage con cloudinaryId y photoUrl válidos", () => {
      const img = PetImage.create({
        cloudinaryId: "pets/abc123",
        photoUrl: "https://res.cloudinary.com/demo/image/upload/pets/abc123.jpg",
      });

      expect(img.cloudinaryId).toBe("pets/abc123");
      expect(img.photoUrl).toBe(
        "https://res.cloudinary.com/demo/image/upload/pets/abc123.jpg"
      );
    });

    it("permite cloudinaryId y photoUrl vacíos (sin validación en el VO)", () => {
      const img = PetImage.create({ cloudinaryId: "", photoUrl: "" });
      expect(img.cloudinaryId).toBe("");
      expect(img.photoUrl).toBe("");
    });
  });

  describe("getters", () => {
    it("expone cloudinaryId a través del getter", () => {
      const img = new PetImage("folder/id", "https://url.com/img.jpg");
      expect(img.cloudinaryId).toBe("folder/id");
    });

    it("expone photoUrl a través del getter", () => {
      const img = new PetImage("folder/id", "https://url.com/img.jpg");
      expect(img.photoUrl).toBe("https://url.com/img.jpg");
    });
  });
});
