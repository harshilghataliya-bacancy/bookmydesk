import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FAKE_NAMES = [
  "Aarav Patel",
  "Priya Sharma",
  "Rahul Mehta",
  "Sneha Desai",
  "Vikram Singh",
  "Anjali Gupta",
  "Karan Joshi",
  "Neha Reddy",
  "Rohan Verma",
  "Divya Nair",
  "Amit Chauhan",
  "Pooja Iyer",
  "Harsh Trivedi",
  "Meera Kulkarni",
  "Siddharth Rao",
  "Kavita Bhatt",
  "Arjun Tiwari",
  "Ritu Agarwal",
  "Manish Pandey",
  "Swati Mishra",
];

async function main() {
  // Get all rooms with their desks
  const rooms = await prisma.room.findMany({
    include: {
      desks: {
        where: {
          isReserved: false,
          booking: null,
        },
        orderBy: { deskNumber: "asc" },
      },
    },
  });

  console.log(`Found ${rooms.length} rooms`);

  let totalBooked = 0;
  let userIndex = 0;

  for (const room of rooms) {
    const availableDesks = room.desks;
    // Book 5-10 random desks per room
    const numToBook = Math.min(
      Math.floor(Math.random() * 6) + 5, // 5-10
      availableDesks.length
    );

    // Shuffle and pick
    const shuffled = [...availableDesks].sort(() => Math.random() - 0.5);
    const desksToBook = shuffled.slice(0, numToBook);

    for (const desk of desksToBook) {
      const name = FAKE_NAMES[userIndex % FAKE_NAMES.length];
      const emailPrefix = name.toLowerCase().replace(/\s+/g, ".") + (userIndex >= FAKE_NAMES.length ? userIndex : "");
      const email = `${emailPrefix}@bacancy.com`;

      // Create user
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          name,
          role: "USER",
        },
      });

      // Check if user already has a booking (userId is unique on bookings)
      const existingBooking = await prisma.booking.findUnique({
        where: { userId: user.id },
      });

      if (!existingBooking) {
        await prisma.booking.create({
          data: {
            deskId: desk.id,
            userId: user.id,
          },
        });
        totalBooked++;
        console.log(`  Booked desk ${desk.deskNumber} in "${room.name}" for ${name}`);
      }

      userIndex++;
    }

    console.log(`Room "${room.name}": booked ${numToBook} desks`);
  }

  console.log(`\nDone! Created ${totalBooked} test bookings.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
