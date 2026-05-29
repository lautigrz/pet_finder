export class InvalidPetNameError extends Error {
  constructor(message: string = "Name must be at least 2 characters long") {
    super(message);
    this.name = "InvalidPetNameError";
  }
}
