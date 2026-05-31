import { describe, it, expect } from "vitest";
import { SightingImage } from "../sighting.images";

describe("SightingImage", () => {
  describe("create", () => {
    it("crea una SightingImage con cloudinaryId y photoUrl válidos", () => {
      const img = SightingImage.create({
        cloudinaryId: "reports/xyz789",
        photoUrl: "https://res.cloudinary.com/demo/image/upload/reports/xyz789.jpg",
      });

      expect(img.cloudinaryId).toBe("reports/xyz789");
      expect(img.photoUrl).toBe(
        "https://res.cloudinary.com/demo/image/upload/reports/xyz789.jpg"
      );
    });

    it("permite cloudinaryId y photoUrl vacíos (sin validación en el VO)", () => {
      const img = SightingImage.create({ cloudinaryId: "", photoUrl: "" });
      expect(img.cloudinaryId).toBe("");
      expect(img.photoUrl).toBe("");
    });
  });

  describe("getters", () => {
    it("expone cloudinaryId a través del getter", () => {
      const img = new SightingImage("reports/id", "https://url.com/img.jpg");
      expect(img.cloudinaryId).toBe("reports/id");
    });

    it("expone photoUrl a través del getter", () => {
      const img = new SightingImage("reports/id", "https://url.com/img.jpg");
      expect(img.photoUrl).toBe("https://url.com/img.jpg");
    });
  });
});
