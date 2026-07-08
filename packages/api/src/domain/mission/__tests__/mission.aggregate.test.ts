import { describe, it, expect } from "vitest";
import { Mission } from "@domain/mission/Mission";
import { SearchArea } from "@domain/mission/value-objects/search-area.vo";
import { MissionStatus } from "@domain/mission/types/mission.status";
import { MissionClosedError } from "@domain/errors/MissionClosedError";
import { UnauthorizedMissionEditError } from "@domain/errors/UnauthorizedMissionEditError";
import { InvalidFieldError } from "@domain/errors/InvalidFieldError";

const createValidSearchArea = () => SearchArea.create(-34.6037, -58.3816, 500);

describe("Agregado del Dominio Mission (Misión)", () => {
  describe("Mission.create", () => {
    it("debe crear exitosamente una nueva misión con el estado OPEN por defecto", () => {
      const searchArea = createValidSearchArea();
      const mission = Mission.create({
        reportId: 10,
        searchArea,
        title: "Search for Firulais",
        description: "Help us find our dog in Palermo"
      });

      expect(mission.missionId).toBeNull();
      expect(mission.publicId).toBeDefined();
      expect(mission.reportId).toBe(10);
      expect(mission.status).toBe(MissionStatus.OPEN);
      expect(mission.volunteerIds).toHaveLength(0);
      expect(mission.createdAt).toBeInstanceOf(Date);
      expect(mission.updatedAt).toBeNull();
    });
  });

  describe("Validación del Área de Búsqueda de la Misión", () => {
    it("debe lanzar InvalidFieldError si el radio es 0 o negativo", () => {
      expect(() => SearchArea.create(-34.6037, -58.3816, 0)).toThrow(InvalidFieldError);
      expect(() => SearchArea.create(-34.6037, -58.3816, -5)).toThrow(InvalidFieldError);
    });

    it("debe lanzar InvalidFieldError si el radio no es un entero", () => {
      expect(() => SearchArea.create(-34.6037, -58.3816, 120.5)).toThrow(InvalidFieldError);
    });
  });

  describe("Unión y salida de voluntarios (y actualizaciones de estado)", () => {
    it("debe cambiar el estado de OPEN a IN_PROGRESS cuando se une el primer voluntario", () => {
      const searchArea = createValidSearchArea();
      const mission = Mission.create({
        reportId: 10,
        searchArea,
        title: "Search for Firulais",
        description: "Help us find our dog in Palermo"
      });

      expect(mission.status).toBe(MissionStatus.OPEN);

      mission.joinVolunteer(1);
      expect(mission.status).toBe(MissionStatus.IN_PROGRESS);
      expect(mission.volunteerIds).toContain(1);
    });

    it("debe mantener el estado IN_PROGRESS cuando se unen más voluntarios", () => {
      const searchArea = createValidSearchArea();
      const mission = Mission.create({
        reportId: 10,
        searchArea,
        title: "Search for Firulais",
        description: "Help us find our dog in Palermo"
      });

      mission.joinVolunteer(1);
      mission.joinVolunteer(2);
      expect(mission.status).toBe(MissionStatus.IN_PROGRESS);
      expect(mission.volunteerIds).toHaveLength(2);
    });

    it("debe cambiar el estado de IN_PROGRESS a OPEN si el último voluntario abandona la misión", () => {
      const searchArea = createValidSearchArea();
      const mission = Mission.create({
        reportId: 10,
        searchArea,
        title: "Search for Firulais",
        description: "Help us find our dog in Palermo"
      });

      mission.joinVolunteer(1);
      mission.joinVolunteer(2);
      expect(mission.status).toBe(MissionStatus.IN_PROGRESS);

      mission.leaveVolunteer(1);
      expect(mission.status).toBe(MissionStatus.IN_PROGRESS);

      mission.leaveVolunteer(2);
      expect(mission.status).toBe(MissionStatus.OPEN);
      expect(mission.volunteerIds).toHaveLength(0);
    });
  });

  describe("Cancelación y Expiración", () => {
    it("debe permitir al dueño cancelar/cerrar la misión", () => {
      const searchArea = createValidSearchArea();
      const mission = Mission.create({
        reportId: 10,
        searchArea,
        title: "Search for Firulais",
        description: "Help us find our dog in Palermo"
      });

      mission.cancel(5, 5);
      expect(mission.status).toBe(MissionStatus.CLOSED);
    });

    it("debe lanzar UnauthorizedMissionEditError si un usuario no dueño intenta cancelar", () => {
      const searchArea = createValidSearchArea();
      const mission = Mission.create({
        reportId: 10,
        searchArea,
        title: "Search for Firulais",
        description: "Help us find our dog in Palermo"
      });

      expect(() => mission.cancel(5, 6)).toThrow(UnauthorizedMissionEditError);
    });

    it("debe lanzar MissionClosedError al intentar unirse o abandonar una misión cerrada", () => {
      const searchArea = createValidSearchArea();
      const mission = Mission.create({
        reportId: 10,
        searchArea,
        title: "Search for Firulais",
        description: "Help us find our dog"
      });

      mission.close();
      expect(() => mission.joinVolunteer(1)).toThrow(MissionClosedError);
      expect(() => mission.leaveVolunteer(1)).toThrow(MissionClosedError);
    });

    it("debe identificar correctamente si una misión ha expirado después de 7 días", () => {
      const searchArea = createValidSearchArea();
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 8);

      const mission = Mission.restore({
        missionId: 1,
        publicId: "uuid",
        reportId: 10,
        searchArea,
        title: "Expired Mission",
        description: "expired",
        status: MissionStatus.OPEN,
        volunteerIds: [],
        createdAt: expiredDate,
        updatedAt: null
      });

      expect(mission.hasExpired()).toBe(true);

      mission.checkExpiration();
      expect(mission.status).toBe(MissionStatus.CLOSED);
    });
  });
});
