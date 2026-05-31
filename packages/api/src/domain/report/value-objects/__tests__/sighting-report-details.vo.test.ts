import { describe, it, expect } from "vitest";
import { SightingReportDetails } from "../sighting-report-details.vo";
import { SightingImage } from "../sighting.images";
import { AnimalType } from "@domain/shared/animal-type/animal-type";

describe("SightingReportDetails", () => {
  const baseParams = {
    animalType: AnimalType.DOG,
    hasIdCollar: true,
    color: "brown",
    images: [] as SightingImage[],
  };

  describe("create — sin imágenes", () => {
    it("crea SightingReportDetails con los valores correctos", () => {
      const details = SightingReportDetails.create(baseParams);

      expect(details.animalType).toBe(AnimalType.DOG);
      expect(details.hasIdCollar).toBe(true);
      expect(details.color).toBe("brown");
      expect(details.images).toHaveLength(0);
    });

    it("crea SightingReportDetails de tipo CAT sin collar", () => {
      const details = SightingReportDetails.create({
        animalType: AnimalType.CAT,
        hasIdCollar: false,
        color: "orange",
        images: [],
      });

      expect(details.animalType).toBe(AnimalType.CAT);
      expect(details.hasIdCollar).toBe(false);
      expect(details.color).toBe("orange");
    });
  });

  describe("create — con imágenes", () => {
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
});
