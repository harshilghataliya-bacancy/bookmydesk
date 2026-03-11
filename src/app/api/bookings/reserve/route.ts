import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, forbidden, badRequest, conflict } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const body = await req.json();
  const { deskId, userId } = body;

  if (!deskId || !userId) {
    return badRequest("deskId and userId are required");
  }

  // Check if desk is already booked/reserved
  const existingDeskBooking = await prisma.booking.findUnique({
    where: { deskId },
  });

  if (existingDeskBooking) {
    return conflict("This desk is already booked or reserved.");
  }

  // Check if user already has a booking
  const existingUserBooking = await prisma.booking.findUnique({
    where: { userId },
    include: { desk: true },
  });

  if (existingUserBooking) {
    return conflict(
      `This user already has Desk ${existingUserBooking.desk.deskNumber} ${
        existingUserBooking.isReserved ? "reserved" : "booked"
      }.`
    );
  }

  // Check desk exists and is active
  const desk = await prisma.desk.findUnique({ where: { id: deskId } });
  if (!desk || !desk.isActive) {
    return badRequest("Invalid desk");
  }

  try {
    const booking = await prisma.booking.create({
      data: {
        deskId,
        userId,
        isReserved: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        desk: {
          include: {
            room: { include: { section: { include: { floor: true } } } },
          },
        },
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch {
    return conflict("Reservation failed due to a conflict. Please try again.");
  }
}
