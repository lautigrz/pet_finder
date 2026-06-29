import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetBreedsUseCase } from "../get-breeds.usecase";
import { CatalogRepository } from "@domain/catalog/catalog.repository";
import { AnimalType } from "@domain/shared/animal-type/animal-type";

describe("GetBreedsUseCase", () => {
    let catalogRepository: CatalogRepository;
    let useCase: GetBreedsUseCase;

    beforeEach(() => {
        catalogRepository = {
            listBreeds: vi.fn(),
            listColors: vi.fn(),
        };
        useCase = new GetBreedsUseCase(catalogRepository);
    });

    it("delega en el repositorio filtrando por tipo de animal", async () => {
        vi.mocked(catalogRepository.listBreeds).mockResolvedValue([{ id: 1, name: "Labrador" }]);

        const result = await useCase.execute(AnimalType.DOG);

        expect(catalogRepository.listBreeds).toHaveBeenCalledWith(AnimalType.DOG);
        expect(result).toEqual([{ id: 1, name: "Labrador" }]);
    });

    it("permite listar sin filtro de tipo", async () => {
        vi.mocked(catalogRepository.listBreeds).mockResolvedValue([]);

        await useCase.execute();

        expect(catalogRepository.listBreeds).toHaveBeenCalledWith(undefined);
    });
});
