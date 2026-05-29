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
        name: 'ACTIVO',
      },
      {
        report_status_id: 2,
        name: 'RESUELTO',
      },
      {
        report_status_id: 3,
        name: 'CERRADO',
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
        name: 'PERDIDO',

      },
      {
        report_type_id: 2,
        name: 'AVISTAMIENTO'
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
        name: 'PERRO',
      },
      {
        animal_type_id: 2,
        name: 'GATO',
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
        name: 'MACHO',
      },
      {
        gender_id: 2,
        name: 'HEMBRA',
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
        name: 'CHICO',
      },
      {
        size_id: 2,
        name: 'MEDIANO',
      },
      {
        size_id: 3,
        name: 'GRANDE',
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