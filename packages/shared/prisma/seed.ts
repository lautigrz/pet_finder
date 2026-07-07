import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  await seedRoles()
  await seedReportStatuses()
  await seedReportTypes()
  await seedAnimalTypes()
  await seedGenders()
  await seedPetSizes()
  await seedColors()
  await seedBreeds()
  await seedContentReportTargetTypes()
  await seedContentReportReasons()
  await seedContentReportStatuses()
  await seedMissionStatuses()
}

const DOG = 1
const CAT = 2

async function seedRoles(): Promise<void> {
  await prisma.role.createMany({
    data: [
      { role_id: 1, name: 'ADMIN' },
      { role_id: 2, name: 'USER' },
    ],
    skipDuplicates: true,
  })
}

async function seedColors(): Promise<void> {
  const colors = [
    'Negro',
    'Blanco',
    'Marrón',
    'Gris',
    'Atigrado',
    'Naranja',
    'Crema',
    'Beige',
    'Dorado',
    'Negro y blanco',
    'Marrón y blanco',
    'Tricolor',
    'Manchado',
    'Otro',
  ]
  await prisma.color.createMany({
    data: colors.map((name) => ({ name })),
    skipDuplicates: true,
  })
}

async function seedBreeds(): Promise<void> {
  const dogBreeds = [
    'Mestizo',
    'Labrador',
    'Caniche',
    'Bulldog',
    'Pastor Alemán',
    'Golden Retriever',
    'Chihuahua',
    'Boxer',
    'Dálmata',
    'Salchicha',
    'Pitbull',
    'Rottweiler',
    'Beagle',
    'Border Collie',
    'Pug',
    'Otra',
  ]
  const catBreeds = [
    'Mestizo',
    'Siamés',
    'Persa',
    'Angora',
    'Bengalí',
    'Maine Coon',
    'Esfinge',
    'Común europeo',
    'Otra',
  ]
  await prisma.breed.createMany({
    data: [
      ...dogBreeds.map((name) => ({ name, animal_type_id: DOG })),
      ...catBreeds.map((name) => ({ name, animal_type_id: CAT })),
    ],
    skipDuplicates: true,
  })
}

async function seedReportStatuses(): Promise<void> {
  await prisma.reportStatus.createMany({
    data: [
      {
        report_status_id: 1,
        name: 'ACTIVE',
      },
      {
        report_status_id: 2,
        name: 'RESOLVED',
      },
      {
        report_status_id: 3,
        name: 'CLOSED',
      },
    ],
    skipDuplicates: true,
  })
}

async function seedReportTypes(): Promise<void> {
  await prisma.reportType.createMany({
    data: [
      {
        report_type_id: 1,
        name: 'LOST',

      },
      {
        report_type_id: 2,
        name: 'SIGHTING'
      },
    ],
    skipDuplicates: true,
  })
}

async function seedAnimalTypes(): Promise<void> {
  await prisma.animalType.createMany({
    data: [
      {
        animal_type_id: 1,
        name: 'DOG',
      },
      {
        animal_type_id: 2,
        name: 'CAT',
      },
    ],
    skipDuplicates: true,
  })
}

async function seedGenders(): Promise<void> {
  await prisma.gender.createMany({
    data: [
      {
        gender_id: 1,
        name: 'MALE',
      },
      {
        gender_id: 2,
        name: 'FEMALE',
      },
    ],
    skipDuplicates: true,
  })
}

async function seedPetSizes(): Promise<void> {
  await prisma.petSize.createMany({
    data: [
      {
        size_id: 1,
        name: 'SMALL',
      },
      {
        size_id: 2,
        name: 'MEDIUM',
      },
      {
        size_id: 3,
        name: 'LARGE',
      },
    ],
    skipDuplicates: true,
  })
}

async function seedContentReportTargetTypes(): Promise<void> {
  await prisma.contentReportTargetType.createMany({
    data: [
      { content_report_target_type_id: 1, name: 'CHAT' },
      { content_report_target_type_id: 2, name: 'POST' },
      { content_report_target_type_id: 3, name: 'USER' },
    ],
    skipDuplicates: true,
  })
}

async function seedContentReportReasons(): Promise<void> {
  await prisma.contentReportReason.createMany({
    data: [
      { content_report_reason_id: 1, name: 'SUSPICIOUS_BEHAVIOR' },
      { content_report_reason_id: 2, name: 'FRAUD_OR_SCAM' },
      { content_report_reason_id: 3, name: 'IMPERSONATION' },
      { content_report_reason_id: 4, name: 'INAPPROPRIATE_CONTENT' },
      { content_report_reason_id: 5, name: 'PERSONAL_DATA_EXPOSED' },
      { content_report_reason_id: 6, name: 'FALSE_INFORMATION' },
      { content_report_reason_id: 7, name: 'SPAM' },
      { content_report_reason_id: 8, name: 'DUPLICATE_REPORT' },
      { content_report_reason_id: 9, name: 'OTHER' },
    ],
    skipDuplicates: true,
  })
}

async function seedContentReportStatuses(): Promise<void> {
  await prisma.contentReportStatus.createMany({
    data: [
      { content_report_status_id: 1, name: 'PENDING' },
      { content_report_status_id: 2, name: 'REVIEWED' },
      { content_report_status_id: 3, name: 'DISMISSED' },
      { content_report_status_id: 4, name: 'SUSPENDED' },
    ],
    skipDuplicates: true,
  })
}

async function seedMissionStatuses(): Promise<void> {
  await prisma.missionStatus.createMany({
    data: [
      { mission_status_id: 1, name: 'OPEN' },
      { mission_status_id: 2, name: 'IN_PROGRESS' },
      { mission_status_id: 3, name: 'CLOSED' },
    ],
    skipDuplicates: true,
  })
}

main()
  .catch((error) => {
    console.error(error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })