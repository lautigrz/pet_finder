import { Mission } from "@domain/mission/Mission";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { MissionCardOutput, MissionOutput, VolunteerOutput } from "../dto/mission.output";

export class MissionOutputMapper {
  static toOutput(params: {
    mission: Mission;
    report: Report;
    pet?: Pet;
    reportPhotoUrl: string | null;
    volunteers: VolunteerOutput[];
  }): MissionOutput {
    const { mission, report, pet, reportPhotoUrl, volunteers } = params;

    return {
      publicId: mission.publicId,
      title: mission.title,
      description: mission.description,
      status: mission.status,
      createdAt: mission.createdAt,
      updatedAt: mission.updatedAt,
      searchArea: this.mapSearchArea(mission),
      report: {
        publicId: report.publicId,
        description: report.description ? report.description.value : "",
        location: this.mapLocation(report),
        photoUrl: reportPhotoUrl,
        title: pet ? pet.name : null,
        type: report.reportType,
        status: report.status,
        petDetails: this.mapPetDetails(pet)
      },
      volunteers
    };
  }

  static toSummaryOutput(params: {
    mission: Mission;
    report: Report;
    pet?: Pet;
    reportPhotoUrl: string | null;
  }): MissionCardOutput {
    const { mission, report, pet, reportPhotoUrl } = params;

    return {
      publicId: mission.publicId,
      status: mission.status,
      createdAt: mission.createdAt,
      searchArea: this.mapSearchArea(mission),
      report: {
        publicId: report.publicId,
        location: this.mapLocation(report),
        photoUrl: reportPhotoUrl,
        title: pet ? pet.name : null,
        status: report.status,
        petDetails: this.mapPetDetails(pet)
      }
    };
  }

  private static mapSearchArea(mission: Mission) {
    return {
      latitude: mission.searchArea.latitude,
      longitude: mission.searchArea.longitude,
      radius: mission.searchArea.radius
    };
  }

  private static mapLocation(report: Report) {
    return {
      address: report.location.address,
      latitude: report.location.latitude,
      longitude: report.location.longitude
    };
  }

  private static mapPetDetails(pet?: Pet) {
    if (!pet) return undefined;
    return {
      name: pet.name,
      photoUrl: pet.images?.[0]?.photoUrl ?? null,
      gender: pet.genderType,
      size: pet.sizeType
    };
  }
}