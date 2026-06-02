import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { PetController } from "../pet.controller";
import { CreatePetUseCase } from "@application/usecase/pet-usecase/create-pet.usecase";
import { GetPetsUseCase } from "@application/usecase/pet-usecase/get-user-pets.usecase";
import { InvalidPetNameError } from "@domain/errors/InvalidPetNameError";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";
import { PetMapper } from "@application/usecase/pet-usecase/mapper/pet-mapper";
import { validateRequest } from "../../middleware/validate.request";
import { createPetRequestSchema } from "../../schemas/pet/pet.schema";

const buildRes = (): Partial<Response> => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
});


const buildReq = (
  bodyData: unknown,
  opts: { params?: unknown; withFiles?: boolean; withAuth?: boolean } = {}
): Partial<Request> => ({
  body: { data: JSON.stringify(bodyData) },
  validated: { body: bodyData },
  files: opts.withFiles !== false
    ? [{ buffer: Buffer.from("fake-image"), mimetype: "image/jpeg", originalname: "pet.jpg" } as Express.Multer.File]
    : [],
  params: (opts.params ?? {}) as Record<string, string>,
  auth: opts.withAuth !== false
    ? { sub: "user-public-id", email: "test@mail.com", isVerified: true }
    : undefined,
});

const validPetBody = {
  userId: 1,
  name: "Firulais",
  animalType: "dog",
  genderType: "male",
  sizeType: "medium",
  color: "brown",
  hasIdCollar: true,
  isVaccinated: true,
  breed: "Labrador",
};

const makePet = (name: string) =>
  Pet.restore({
    idPet: 1,
    publicId: "pet-uuid",
    userId: 1,
    name,
    animalType: AnimalType.DOG,
    genderType: GenderType.MALE,
    sizeType: SizeType.MEDIUM,
    color: "brown",
    hasIdCollar: false,
    isVaccinated: true,
    breed: "Mix",
    petImage: [],
    createdAt: new Date(),
  });

describe("PetController", () => {
  let createPetUseCase: CreatePetUseCase;
  let getPetsUseCase: GetPetsUseCase;
  let controller: PetController;

  beforeEach(() => {
    createPetUseCase = {
      execute: vi.fn(),
    } as unknown as CreatePetUseCase;

    getPetsUseCase = {
      execute: vi.fn(),
    } as unknown as GetPetsUseCase;

    controller = new PetController(createPetUseCase, getPetsUseCase);
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe("create — cuando el body es válido", () => {
    it("retorna 201 con el publicId de la mascota creada", async () => {
      vi.mocked(createPetUseCase.execute).mockResolvedValue({
        publicId: "new-pet-uuid",
      });
      const req = buildReq(validPetBody);
      const res = buildRes();
      await controller.create(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Pet created successfully",
        publicId: "new-pet-uuid",
      });
    });
  });

  describe("create — cuando el body es inválido", () => {
    it("retorna 400 si falta el campo name", async () => {
      const req = buildReq({ ...validPetBody, name: undefined });
      const res = buildRes();
      const next = vi.fn();

      validateRequest(createPetRequestSchema)(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("retorna 400 si el animalType es inválido", async () => {
      const req = buildReq({ ...validPetBody, animalType: "dragon" });
      const res = buildRes();
      const next = vi.fn();

      validateRequest(createPetRequestSchema)(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("create — errores de dominio", () => {
    it("retorna 400 con el mensaje si el use case lanza InvalidPetNameError", async () => {

      vi.mocked(createPetUseCase.execute).mockRejectedValue(
        new InvalidPetNameError("Name must be at least 2 characters long")
      );

      const req = buildReq(validPetBody);
      const res = buildRes();
      await controller.create(req as Request, res as Response);


      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Name must be at least 2 characters long",
      });
    });

    it("retorna 500 si ocurre un error inesperado", async () => {

      vi.mocked(createPetUseCase.execute).mockRejectedValue(
        new Error("DB crashed")
      );

      const req = buildReq(validPetBody);
      const res = buildRes();
      await controller.create(req as Request, res as Response);


      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });

  // ─── getAllByUserId ───────────────────────────────────────────────────────

  describe("getAllByUserId — cuando hay mascotas", () => {
    it("retorna 200 con la lista de mascotas mapeadas", async () => {

      const pets = [PetMapper.toOutput(makePet("Firulais")), PetMapper.toOutput(makePet("Max"))];
      vi.mocked(getPetsUseCase.execute).mockResolvedValue(pets);

      const req = buildReq({});
      const res = buildRes();
      await controller.getAllByUserId(req as Request, res as Response);


      expect(res.status).toHaveBeenCalledWith(200);
      const body = vi.mocked(res.json)!.mock.lastCall![0] as unknown[];
      expect(body).toHaveLength(2);
    });
  });

  describe("getAllByUserId — cuando no hay mascotas", () => {
    it("retorna 200 con lista vacía", async () => {

      vi.mocked(getPetsUseCase.execute).mockResolvedValue([]);

      const req = buildReq({});
      const res = buildRes();
      await controller.getAllByUserId(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe("getAllByUserId — error inesperado", () => {
    it("retorna 500 si el use case falla", async () => {

      vi.mocked(getPetsUseCase.execute).mockRejectedValue(new Error("DB down"));

      const req = buildReq({});
      const res = buildRes();
      await controller.getAllByUserId(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });
});
