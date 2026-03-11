import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Resetting database...");

  // Delete all data in order (bookings → desks → rooms → sections → floors)
  await prisma.booking.deleteMany();
  await prisma.desk.deleteMany();
  await prisma.room.deleteMany();
  await prisma.section.deleteMany();
  await prisma.floor.deleteMany();
  console.log("Cleared all existing data.");

  // Keep existing users (don't delete users)

  // Create 5 floors: 1, 2, 3, 4, 6
  const floorNumbers = [1, 2, 3, 4, 6];
  const sectionLabels = ["15th Side", "16th Side"];

  for (const num of floorNumbers) {
    const floor = await prisma.floor.create({
      data: {
        id: `floor-${num}`,
        name: `Floor ${num}`,
        displayOrder: num,
      },
    });
    console.log(`Created floor: ${floor.name}`);

    for (const label of sectionLabels) {
      const sectionId = `section-${num}-${label.replace(/\s/g, "-").toLowerCase()}`;
      const section = await prisma.section.create({
        data: {
          id: sectionId,
          floorId: floor.id,
          label,
        },
      });
      console.log(`  Section: ${section.label}`);
    }
  }

  // Summary
  const totalFloors = await prisma.floor.count();
  const totalSections = await prisma.section.count();
  console.log(`\nSeed complete!`);
  console.log(`  ${totalFloors} floors`);
  console.log(`  ${totalSections} sections`);
  console.log(`  0 rooms (admin will create rooms)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
