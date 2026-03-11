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

  const sections = await prisma.section.findMany({
    where: { floorId: id },
    include: {
      rooms: {
        include: {
          desks: {
            include: { booking: true },
          },
        },
      },
    },
  });

  const result = sections.map((section) => {
    let totalDesks = 0;
    let bookedDesks = 0;
    section.rooms.forEach((room) => {
      room.desks.forEach((desk) => {
        if (desk.isActive) {
          totalDesks++;
          if (desk.booking) bookedDesks++;
        }
      });
    });
    return {
      id: section.id,
      label: section.label,
      floorId: section.floorId,
      roomCount: section.rooms.length,
      totalDesks,
      bookedDesks,
      availableDesks: totalDesks - bookedDesks,
    };
  });

  return NextResponse.json(result);
}
