import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, forbidden, badRequest } from "@/lib/api-utils";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const { id: roomId } = params;
  const body = await req.json();
  const { startSeat, endSeat, action } = body;

  if (!startSeat || !endSeat) {
    return badRequest("startSeat and endSeat are required");
  }

  const from = Math.min(startSeat, endSeat);
  const to = Math.max(startSeat, endSeat);

  if (from < 1) return badRequest("Seat numbers must be at least 1");

  // Verify room exists
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) return badRequest("Room not found");

  const maxSeat = room.rows * room.cols;
  if (to > maxSeat) {
    return badRequest(`Seat numbers must be at most ${maxSeat}`);
  }

  if (action === "unreserve") {
    // Unreserve: set isReserved = false for desks in range
    const result = await prisma.desk.updateMany({
      where: {
        roomId,
        deskNumber: { gte: from, lte: to },
        isReserved: true,
      },
      data: { isReserved: false },
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} desk(s) unreserved`,
      count: result.count,
    });
  }

  // Reserve: check no bookings exist on these desks first
  const desksWithBookings = await prisma.desk.findMany({
    where: {
      roomId,
      deskNumber: { gte: from, lte: to },
      booking: { isNot: null },
    },
    select: { deskNumber: true },
  });

  if (desksWithBookings.length > 0) {
    const nums = desksWithBookings.map((d) => d.deskNumber).join(", ");
    return badRequest(
      `Desk(s) ${nums} already have bookings. Free them first.`
    );
  }

  const result = await prisma.desk.updateMany({
    where: {
      roomId,
      deskNumber: { gte: from, lte: to },
      isActive: true,
    },
    data: { isReserved: true },
  });

  return NextResponse.json({
    success: true,
    message:
      from === to
        ? `Desk ${from} reserved`
        : `Desks ${from}–${to} reserved (${result.count} desk(s))`,
    count: result.count,
  });
}
