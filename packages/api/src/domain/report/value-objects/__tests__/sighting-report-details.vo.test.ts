import { describe, it, expect } from "vitest";
import { SightingReportDetails } from "../sighting-report-details.vo";
import { SightingImage } from "../sighting.images";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";
import { InvalidFieldError } from "../../../errors/InvalidFieldError";

describe("SightingReportDetails", () => {
  const mockImage = SightingImage.create({ cloudinaryId: "id1", photoUrl: "https://url.com/1.jpg" });

  const baseParams = {
    animalType: AnimalType.DOG,
    hasIdCollar: true,
    color: "brown",
    isInTransit: false,
    images: [mockImage],
  };

  describe("create — con valores básicos", () => {
    it("crea SightingReportDetails con los valores correctos y campos opcionales nulos", () => {
      const details = SightingReportDetails.create(baseParams);

      expect(details.animalType).toBe(AnimalType.DOG);
      expect(details.hasIdCollar).toBe(true);
      expect(details.color).toBe("brown");
      expect(details.isInTransit).toBe(false);
      expect(details.images).toHaveLength(1);
      expect(details.petName).toBeNull();
      expect(details.genderType).toBeNull();
      expect(details.sizeType).toBeNull();
    });

    it("crea SightingReportDetails de tipo CAT sin collar y en tránsito", () => {
      const details = SightingReportDetails.create({
        animalType: AnimalType.CAT,
        hasIdCollar: false,
        color: "orange",
        isInTransit: true,
        images: [mockImage],
      });

      expect(details.animalType).toBe(AnimalType.CAT);
      expect(details.hasIdCollar).toBe(false);
      expect(details.color).toBe("orange");
      expect(details.isInTransit).toBe(true);
    });

    it("crea SightingReportDetails con campos opcionales especificados (petName, genderType, sizeType)", () => {
      const details = SightingReportDetails.create({
        ...baseParams,
        petName: "Rex",
        genderType: GenderType.MALE,
        sizeType: SizeType.LARGE,
      });

      expect(details.petName).toBe("Rex");
      expect(details.genderType).toBe(GenderType.MALE);
      expect(details.sizeType).toBe(SizeType.LARGE);
    });
  });

  describe("create — con múltiples imágenes", () => {
    it("incluye las imágenes correctamente", () => {
      const img1 = SightingImage.create({ cloudinaryId: "id1", photoUrl: "https://url.com/1.jpg" });
      const img2 = SightingImage.create({ cloudinaryId: "id2", photoUrl: "https://url.com/2.jpg" });

      const details = SightingReportDetails.create({
        ...baseParams,
        images: [img1, img2],
      });

      expect(details.images).toHaveLength(2);
      expect(details.images[0]?.cloudinaryId).toBe("id1");
      expect(details.images[1]?.photoUrl).toBe("https://url.com/2.jpg");
    });
  });

  describe("create — validación de imágenes", () => {
    it("lanza InvalidFieldError si se crea sin imágenes", () => {
      expect(() => SightingReportDetails.create({
        ...baseParams,
        images: [],
      })).toThrow(InvalidFieldError);
    });
  });
});
