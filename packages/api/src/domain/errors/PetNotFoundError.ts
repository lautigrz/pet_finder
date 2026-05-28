export class PetNotFoundError extends Error {
  constructor(petId: number | string) {
    super(`Pet not found with ID: ${petId}`);
    this.name = "PetNotFoundError";
  }
}
