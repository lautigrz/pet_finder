import { InvalidFieldError, InvalidReportTypeError } from "@application/errors/errors";
import { User } from "@domain/entities/User";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { ReportDetails } from "@domain/report/types/report-details.type";
import { ReportType } from "@domain/report/types/report.type";
import { ReportDescription } from "@domain/report/value-objects/description.vo";
import { Location } from "@domain/report/value-objects/location.vo";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { StorageService } from "@application/ports/StorageService";
import { ExifReader } from "@application/ports/ExifReader";
import { ExifAnalysis, ExifSuspicionAnalyzer } from "@domain/shared/exif/exif-suspicion.analyzer";
import { SightingImage } from "@domain/report/value-objects/sighting.images";
import { CreateReportDTO, LocationDTO } from "./dto/create-report.dto";

export type { CreateReportDTO, LocationDTO };

export class CreateReportUseCase {
    constructor(
        private reportRepository: ReportRepository,
        private userRepository: IUserRepository,
        private petRepository: PetRepository,
        private storageService: StorageService,
        private exifReader: ExifReader,
    ) { }

    async execute(dto: CreateReportDTO, userId: string): Promise<{ publicId: string }> {
        const user = await this.userRepository.findByPublicId(userId);
        if (!user) throw new Error("User not found");

        let petInternalId: number | null = null;
        let lostPet: Pet | null = null;

        if (dto.type === ReportType.LOST && dto.petId) {
            lostPet = await this.petRepository.findByPublicId(dto.petId);
            if (!lostPet) throw new Error("Pet not found");
            petInternalId = lostPet.idPet;
        }

        this.validateDTO(dto);

        const location = this.buildLocation(dto.location);
        const details = await this.buildDetails(dto, petInternalId!);
        const report = this.buildReport(dto, location, details, user);

        report.applyExifAnalysis(await this.analyzeExif(dto, lostPet));

        let images: SightingImage[] = [];
        if (dto.type === ReportType.LOST && dto.images && dto.images.length > 0) {
            images = await this.buildImages(dto.images);
        }

        await this.reportRepository.save(report, images);

        return { publicId: report.publicId };
    }

    private async analyzeExif(dto: CreateReportDTO, lostPet: Pet | null): Promise<ExifAnalysis> {
        const results = await Promise.all(
            (dto.images ?? []).map((buffer) => this.exifReader.read(buffer))
        );
        const imageAnalysis = ExifSuspicionAnalyzer.analyzeMany(results);

        if (dto.type === ReportType.LOST && lostPet) {
            return {
                isSuspicious: lostPet.suspicious || imageAnalysis.isSuspicious,
                reasons: [...new Set([...lostPet.suspiciousReasons, ...imageAnalysis.reasons])],
                exifData: {},
            };
        }

        return imageAnalysis;
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

    private validateDTO(dto: CreateReportDTO): void {
        if (dto.occurredAt > new Date()) {
            throw new InvalidFieldError('occurredAt', 'cannot be in the future');
        }
    }
}