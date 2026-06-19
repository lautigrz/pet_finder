import { MatchResult } from '@domain/entities/match-result.entity';
import { ReportEntity } from '@domain/entities/report.entity';
import { cosineSimilarity } from '../../utils/normalize';
import { logger } from '@pet-alert/shared';


const IMAGE_WEIGHT = 0.7;
const DESCRIPTION_WEIGHT = 0.3;


const MAX_STRUCTURED_WEIGHT = 0.20;
const STRUCTURED_WEIGHT_PER_FIELD = 0.05;



function imageScore(
  lostEmbeddings: (number[] | null)[],
  sightingEmbeddings: (number[] | null)[],
): number {
  const validLost = lostEmbeddings.filter((e): e is number[] => e !== null);
  const validSighting = sightingEmbeddings.filter((e): e is number[] => e !== null);

  if (validLost.length === 0 || validSighting.length === 0) return 0;

  const scores = validLost.map(embA =>
    Math.max(...validSighting.map(embB => cosineSimilarity(embA, embB))),
  );

  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}


function descriptionScore(
  lostEmbedding: number[] | null,
  sightingEmbedding: number[] | null,
): number {
  if (!lostEmbedding || !sightingEmbedding) return 0;
  return cosineSimilarity(lostEmbedding, sightingEmbedding);
}


function sharedFieldsScore(sourceReport: ReportEntity,
  candidateReport: ReportEntity) {

  const sourceDetails = sourceReport.details;
  const candidateDetails = candidateReport.details;

  let count = 0;

  if (sourceDetails.breed !== undefined && sourceDetails.breed === candidateDetails.breed) count++;
  if (sourceDetails.color !== undefined && sourceDetails.color === candidateDetails.color) count++;
  if (sourceDetails.size !== undefined && sourceDetails.size === candidateDetails.size) count++;
  if (sourceDetails.gender !== undefined && sourceDetails.gender === candidateDetails.gender) count++;
  if (sourceDetails.hasIdIdentification !== undefined && sourceDetails.hasIdIdentification === candidateDetails.hasIdIdentification) count++;

  return count;

}

function structuredScore(sourceReport: ReportEntity,
  candidateReport: ReportEntity) {

  const a = sourceReport.details;
  const b = candidateReport.details;

  let score = 0
  let maxScore = 0

  if (a.breed && b.breed) {
    maxScore += 0.8
    if (a.breed === b.breed) score += 0.8
  }

  if (a.color && b.color) {
    maxScore += 0.6
    if (a.color === b.color) score += 0.6
  }

  if (a.size && b.size) {
    maxScore += 0.1
    if (a.size === b.size) score += 0.1
  }

  if (a.gender && b.gender) {
    maxScore += 0.3
    if (a.gender === b.gender) score += 0.3
  }

  if (a.hasIdIdentification !== undefined &&
    b.hasIdIdentification !== undefined) {
    maxScore += 0.2
    if (a.hasIdIdentification === b.hasIdIdentification) score += 0.2
  }


  return maxScore > 0 ? score / maxScore : 0

}


export class MatchingDomainService {

  computeScores(
    sourceReport: ReportEntity,
    candidateReport: ReportEntity,
  ): {
    score: number
    imageScore: number
    descriptionScore: number
    structuredScore: number
    sharedFields: number
  } {
    const imgScore = imageScore(
      sourceReport.images.map(i => i.embeddingPhoto),
      candidateReport.images.map(i => i.embeddingPhoto),
    );

    const descScore = descriptionScore(
      sourceReport.embeddingDescription,
      candidateReport.embeddingDescription,
    );


    const sharedFields = sharedFieldsScore(sourceReport, candidateReport);

    if (sharedFields === 0) {
      logger.debug(`[MatchingDomainService] No shared structured fields — skipping structured score | reportId=${sourceReport.reportId} candidateId=${candidateReport.reportId}`);
      return {
        imageScore: imgScore,
        descriptionScore: descScore,
        score: IMAGE_WEIGHT * imgScore + DESCRIPTION_WEIGHT * descScore,
        structuredScore: 0,
        sharedFields: 0,
      };
    }

    const structuredWeight = Math.min(MAX_STRUCTURED_WEIGHT, sharedFields * STRUCTURED_WEIGHT_PER_FIELD);

    const remaining = 1 - structuredWeight;

    const structured = structuredScore(sourceReport, candidateReport);

    return {
      imageScore: imgScore,
      descriptionScore: descScore,
      structuredScore: structured,
      sharedFields,
      score:
        imgScore * (remaining * IMAGE_WEIGHT) +
        descScore * (remaining * DESCRIPTION_WEIGHT) +
        structured * structuredWeight,
    };
  }


  rankCandidates(
    sourceReport: ReportEntity,
    candidates: ReportEntity[],
  ): MatchResult[] {
    const imagesWithEmbedding = sourceReport.images.filter(i => i.embeddingPhoto !== null);
    if (imagesWithEmbedding.length === 0) {
      logger.warn(
        `[MatchingDomainService] Source report ${sourceReport.reportId} has no images with embeddings (total images: ${sourceReport.images.length}) — imageScore will be 0 for all candidates`,
      );
    }

    logger.info(`Imagenes a evaluar: ${sourceReport.images.length}`);
    logger.info(`Candidatos: ${candidates.length}`);

    return candidates
      .map(candidate => ({
        reportId: candidate.reportId,
        publicId: candidate.publicId,
        ...this.computeScores(sourceReport, candidate),
      }))
      .sort((a, b) => b.score - a.score);
  }
}
