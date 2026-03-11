import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-utils";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const { id } = params;

  const rooms = await prisma.room.findMany({
    where: { sectionId: id },
    include: {
      desks: {
        include: { booking: true },
      },
    },
  });

  const result = rooms.map((room) => {
    const activeDesks = room.desks.filter((d) => d.isActive);
    const bookedDesks = activeDesks.filter((d) => d.booking);
    return {
      id: room.id,
      name: room.name,
      sectionId: room.sectionId,
      rows: room.rows,
      cols: room.cols,
      totalDesks: activeDesks.length,
      bookedDesks: bookedDesks.length,
      availableDesks: activeDesks.length - bookedDesks.length,
    };
  });

  return NextResponse.json(result);
}
