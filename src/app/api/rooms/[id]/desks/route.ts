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

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      section: {
        include: {
          floor: true,
        },
      },
      desks: {
        where: { isActive: true },
        orderBy: { deskNumber: "asc" },
        include: {
          booking: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: room.id,
    name: room.name,
    rows: room.rows,
    cols: room.cols,
    sectionLabel: room.section.label,
    floorName: room.section.floor.name,
    floorId: room.section.floor.id,
    sectionId: room.section.id,
    desks: room.desks.map((desk) => ({
      id: desk.id,
      deskNumber: desk.deskNumber,
      row: desk.row,
      col: desk.col,
      isReserved: desk.isReserved,
      booking: desk.booking
        ? {
            id: desk.booking.id,
            userId: desk.booking.user.id,
            userName: desk.booking.user.name,
            userAvatar: desk.booking.user.avatarUrl,
            isReserved: desk.booking.isReserved,
            bookedAt: desk.booking.bookedAt,
          }
        : null,
    })),
  });
}
