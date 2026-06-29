import { AnimalType } from "@domain/shared/animal-type/animal-type";
import { ReportType } from "@domain/report/types/report.type";
import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";

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
        images?: Buffer[];
    }
    | {
        type: typeof ReportType.SIGHTING;
        petName?: string;
        animalType: AnimalType;
        genderType?: GenderType;
        sizeType?: SizeType;
        breed?: string;
        hasIdCollar: boolean;
        color: string;
        isInTransit: boolean;
        occurredAt: Date;
        location: LocationDTO;
        description: string;
        images: Buffer[];
    };
