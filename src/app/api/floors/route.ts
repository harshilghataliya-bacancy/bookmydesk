import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, unauthorized, forbidden, badRequest } from "@/lib/api-utils";

export async function GET() {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const floors = await prisma.floor.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      sections: {
        include: {
          rooms: {
            include: {
              desks: {
                include: { booking: true },
              },
            },
          },
        },
      },
    },
  });

  const result = floors.map((floor) => {
    let totalDesks = 0;
    let bookedDesks = 0;
    floor.sections.forEach((section) => {
      section.rooms.forEach((room) => {
        room.desks.forEach((desk) => {
          if (desk.isActive) {
            totalDesks++;
            if (desk.booking) bookedDesks++;
          }
        });
      });
    });
    return {
      id: floor.id,
      name: floor.name,
      displayOrder: floor.displayOrder,
      totalDesks,
      bookedDesks,
      availableDesks: totalDesks - bookedDesks,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const body = await req.json();
  const { name, displayOrder } = body;

  if (!name) return badRequest("Floor name is required");

  const floor = await prisma.floor.create({
    data: {
      name,
      displayOrder: displayOrder || 0,
    },
  });

  return NextResponse.json(floor, { status: 201 });
}
