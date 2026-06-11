import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetColorsUseCase } from "../get-colors.usecase";
import { CatalogRepository } from "@domain/catalog/catalog.repository";

describe("GetColorsUseCase", () => {
    let catalogRepository: CatalogRepository;
    let useCase: GetColorsUseCase;

    beforeEach(() => {
        catalogRepository = {
            listBreeds: vi.fn(),
            listColors: vi.fn(),
        };
        useCase = new GetColorsUseCase(catalogRepository);
    });

    it("devuelve los colores del repositorio", async () => {
        vi.mocked(catalogRepository.listColors).mockResolvedValue([{ id: 1, name: "Negro" }]);

        const result = await useCase.execute();

        expect(catalogRepository.listColors).toHaveBeenCalledOnce();
        expect(result).toEqual([{ id: 1, name: "Negro" }]);
    });
});
