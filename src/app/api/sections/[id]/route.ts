import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, forbidden, notFound, conflict } from "@/lib/api-utils";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const { id } = params;

  const section = await prisma.section.findUnique({
    where: { id },
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

  if (!section) return notFound("Section not found");

  const hasBookings = section.rooms.some((room) =>
    room.desks.some((desk) => desk.booking)
  );

  if (hasBookings) {
    return conflict("Cannot delete section with active bookings");
  }

  await prisma.section.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const { id } = params;
  const body = await req.json();

  const updated = await prisma.section.update({
    where: { id },
    data: { label: body.label },
  });

  return NextResponse.json(updated);
}
