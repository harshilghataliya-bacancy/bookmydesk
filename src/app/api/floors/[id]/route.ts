import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, forbidden, notFound, conflict } from "@/lib/api-utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const { id } = params;
  const body = await req.json();
  const { name, displayOrder } = body;

  const floor = await prisma.floor.findUnique({ where: { id } });
  if (!floor) return notFound("Floor not found");

  const updated = await prisma.floor.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(displayOrder !== undefined && { displayOrder }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const { id } = params;

  const floor = await prisma.floor.findUnique({
    where: { id },
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

  if (!floor) return notFound("Floor not found");

  const hasBookings = floor.sections.some((section) =>
    section.rooms.some((room) => room.desks.some((desk) => desk.booking))
  );

  if (hasBookings) {
    return conflict("Cannot delete floor with active bookings");
  }

  await prisma.floor.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
