import { InvalidReportTypeError } from "@application/errors/errors";
import { User } from "@domain/entities/User";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import { ReportDetails } from "@domain/report/types/report-details.type";
import { ReportType, ReportTypeToNumber } from "@domain/report/types/report.type";
import { ReportDescription } from "@domain/report/value-objects/description.vo";
import { Location } from "@domain/report/value-objects/location.vo";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import type { PetRepository } from "@domain/pet/repositories/pet.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { StorageService } from "@application/ports/StorageService";
import { SightingImage } from "@domain/report/value-objects/sighting.images";
import { CreateReportDTO, LocationDTO } from "./dto/create-report.dto";
import { enqueueMatchingJob } from "@infrastructure/queue/embedding.queue";
import { inject, injectable } from "tsyringe";
import { TypeJob, logger } from "@pet-alert/shared";
import type { NotifyNearbyLostOwnersUseCase } from "@application/usecase/notify-nearby-lost-owners/notify-nearby-lost-owners.usecase";

export type { CreateReportDTO, LocationDTO };

@injectable()
export class CreateReportUseCase {
    constructor(
        @inject("ReportRepository")
        private reportRepository: ReportRepository,
        @inject("UserRepository")
        private userRepository: IUserRepository,
        @inject("PetRepository")
        private petRepository: PetRepository,
        @inject("StorageService")
        private storageService: StorageService,
        @inject("NotifyNearbyLostOwnersUseCase")
        private notifyNearbyLostOwnersUseCase: NotifyNearbyLostOwnersUseCase,
    ) { }

    async execute(dto: CreateReportDTO, userId: string): Promise<{ publicId: string }> {
        const user = await this.userRepository.findByPublicId(userId);
        if (!user) throw new Error("User not found");

        let petInternalId: number | null = null;

        if (dto.type === ReportType.LOST && dto.petId) {
            const pet: Pet | null = await this.petRepository.findByPublicId(dto.petId);
            if (!pet) throw new Error("Pet not found");
            petInternalId = pet.idPet;
        }

        const location = this.buildLocation(dto.location);
        const details = await this.buildDetails(dto, petInternalId!);
        const report = this.buildReport(dto, location, details, user);

        const reportId = await this.reportRepository.save(report);

        if (reportId) {
            await enqueueMatchingJob({ type: TypeJob.RUN_MATCHING, reportId: reportId, reportType: ReportTypeToNumber[dto.type], reportTypeName: dto.type });
        }

        if (dto.type === ReportType.SIGHTING) {
            void this.notifyNearbyLostOwnersUseCase
                .execute(report.publicId)
                .catch((error) => logger.error("Failed to notify nearby lost owners", { error }));
        }

        return { publicId: report.publicId };
    }



    private buildLocation(locationDTO: LocationDTO): Location {
        return Location.create({
            address: locationDTO.address,
            latitude: locationDTO.latitude,
            longitude: locationDTO.longitude,
        });
    }

    private buildReport(dto: CreateReportDTO, location: Location, details: ReportDetails, user: User): Report {
        return Report.create({
            userPublicId: user.id,
            userId: user.internalId!,
            type: dto.type,
            description: dto.description ? ReportDescription.create(dto.description) : null,
            location,
            details,
            occurredAt: dto.occurredAt,
        });
    }

    private async buildDetails(dto: CreateReportDTO, petId?: number): Promise<ReportDetails> {
        if (dto.type === ReportType.LOST) {
            if (!petId) {
                throw new Error("Pet id is required for lost report");
            }
            return LostReportDetails.create({ petId });
        }

        if (dto.type === ReportType.SIGHTING) {
            const images = await this.buildImages(dto.images);
            return SightingReportDetails.create({
                petName: dto.petName,
                animalType: dto.animalType,
                genderType: dto.genderType,
                sizeType: dto.sizeType,
                breed: dto.breed,
                hasIdCollar: dto.hasIdCollar,
                color: dto.color,
                isInTransit: dto.isInTransit,
                images
            });
        }

        throw new InvalidReportTypeError("Type must be either 'LOST' or 'SIGHTING'");
    }

    private async buildImages(images: Buffer[]): Promise<SightingImage[]> {
        const results = await Promise.all(
            images.map(img => this.storageService.upload(img, 'reports'))
        );

        return results.map(res => SightingImage.create({
            cloudinaryId: res.publicId,
            photoUrl: res.url,
        }));
    }
}