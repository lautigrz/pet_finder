import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { ReportType } from "@domain/report/types/report.type";

export interface LocationDTO {
    address: string;
    latitude: number;
    longitude: number;
}

export type CreateReportDTO =
    | {
        type: typeof ReportType.LOST;
        petId: string;
        occurredAt: Date;
        location: LocationDTO;
        description: string;
    }
    | {
        type: typeof ReportType.SIGHTING;
        animalType: AnimalType;
        hasIdCollar: boolean;
        color: string;
        occurredAt: Date;
        location: LocationDTO;
        description: string;
        images: Buffer[];
    };
