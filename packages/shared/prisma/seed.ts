import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  await seedReportStatuses()
  await seedReportTypes()
  await seedAnimalTypes()
  await seedGenders()
  await seedPetSizes()
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

main()
  .catch((error) => {
    console.error(error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })