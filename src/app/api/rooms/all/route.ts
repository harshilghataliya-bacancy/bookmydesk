import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-utils";

export async function GET() {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const rooms = await prisma.room.findMany({
    include: {
      section: {
        include: { floor: true },
      },
      desks: {
        where: { isActive: true },
        include: { booking: true },
      },
    },
    orderBy: [
      { section: { floor: { displayOrder: "asc" } } },
      { section: { label: "asc" } },
      { name: "asc" },
    ],
  });

  const result = rooms.map((room) => {
    const totalDesks = room.desks.length;
    const bookedDesks = room.desks.filter((d) => d.booking).length;
    const reservedDesks = room.desks.filter((d) => d.isReserved && !d.booking).length;
    return {
      id: room.id,
      name: room.name,
      rows: room.rows,
      cols: room.cols,
      floorId: room.section.floor.id,
      floorName: room.section.floor.name,
      sectionId: room.section.id,
      sectionLabel: room.section.label,
      totalDesks,
      bookedDesks,
      reservedDesks,
      availableDesks: totalDesks - bookedDesks - reservedDesks,
    };
  });

  return NextResponse.json(result);
}
