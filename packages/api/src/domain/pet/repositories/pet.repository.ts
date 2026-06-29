import { Pet } from "../aggregates/PetAggregate"

export interface PetRepository {
    save(pet: Pet): Promise<void>
    update(pet: Pet): Promise<void>
    findByPublicId(publicId: string): Promise<Pet | null>
    findById(id: number): Promise<Pet | null>
    findAllByUserId(userId: number): Promise<Pet[]>
    delete(pet: Pet): Promise<void>
}