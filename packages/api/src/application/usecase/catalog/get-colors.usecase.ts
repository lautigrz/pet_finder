import { CatalogItem, CatalogRepository } from "@domain/catalog/catalog.repository";

export class GetColorsUseCase {
    constructor(private readonly catalogRepository: CatalogRepository) { }

    execute(): Promise<CatalogItem[]> {
        return this.catalogRepository.listColors();
    }
}
