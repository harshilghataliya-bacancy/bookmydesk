import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-utils";

export async function GET() {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const booking = await prisma.booking.findUnique({
    where: { userId: session.user.id },
    include: {
      desk: {
        include: {
          room: {
            include: {
              section: {
                include: { floor: true },
              },
            },
          },
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    id: booking.id,
    deskNumber: booking.desk.deskNumber,
    roomName: booking.desk.room.name,
    roomId: booking.desk.room.id,
    sectionLabel: booking.desk.room.section.label,
    sectionId: booking.desk.room.section.id,
    floorName: booking.desk.room.section.floor.name,
    floorId: booking.desk.room.section.floor.id,
    isReserved: booking.isReserved,
    bookedAt: booking.bookedAt,
  });
}
