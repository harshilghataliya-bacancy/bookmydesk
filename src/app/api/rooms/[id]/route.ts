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
  const { name, sectionId, rows, cols } = body;

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      desks: {
        include: { booking: true },
      },
    },
  });

  if (!room) return notFound("Room not found");

  // If changing rows/cols, check for bookings
  if ((rows !== undefined && rows !== room.rows) || (cols !== undefined && cols !== room.cols)) {
    const hasBookings = room.desks.some((desk) => desk.booking);
    if (hasBookings) {
      return conflict("Cannot edit room dimensions with active bookings");
    }

    const newRows = rows || room.rows;
    const newCols = cols || room.cols;

    // Delete old desks and regenerate (column-wise numbering)
    await prisma.desk.deleteMany({ where: { roomId: id } });

    const desks = [];
    let deskNum = 1;
    for (let col = 0; col < newCols; col++) {
      for (let row = 0; row < newRows; row++) {
        desks.push({
          roomId: id,
          deskNumber: deskNum++,
          row,
          col,
          isActive: true,
        });
      }
    }
    await prisma.desk.createMany({ data: desks });

    await prisma.room.update({
      where: { id },
      data: {
        name: name || room.name,
        rows: newRows,
        cols: newCols,
        ...(sectionId && { sectionId }),
      },
    });
  } else {
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (sectionId) updateData.sectionId = sectionId;
    if (Object.keys(updateData).length > 0) {
      await prisma.room.update({
        where: { id },
        data: updateData,
      });
    }
  }

  const updated = await prisma.room.findUnique({
    where: { id },
    include: { desks: true },
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

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      desks: {
        include: { booking: true },
      },
    },
  });

  if (!room) return notFound("Room not found");

  const hasBookings = room.desks.some((desk) => desk.booking);
  if (hasBookings) {
    return conflict("Cannot delete room with active bookings");
  }

  await prisma.room.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
