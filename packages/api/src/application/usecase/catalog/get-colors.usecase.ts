import { inject, injectable } from "tsyringe";
import type { CatalogItem, CatalogRepository } from "@domain/catalog/catalog.repository";

@injectable()
export class GetColorsUseCase {
    constructor(
        @inject("CatalogRepository")
        private readonly catalogRepository: CatalogRepository
    ) { }

    execute(): Promise<CatalogItem[]> {
        return this.catalogRepository.listColors();
    }
}
