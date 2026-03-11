import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, forbidden, badRequest } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const body = await req.json();
  const { sectionId, name, rows, cols } = body;

  if (!sectionId || !name || !rows || !cols) {
    return badRequest("sectionId, name, rows, and cols are required");
  }

  const room = await prisma.room.create({
    data: {
      sectionId,
      name,
      rows,
      cols,
    },
  });

  // Auto-generate desks (numbered column-wise: down each column first)
  const desks = [];
  let deskNum = 1;
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      desks.push({
        roomId: room.id,
        deskNumber: deskNum++,
        row,
        col,
        isActive: true,
      });
    }
  }

  await prisma.desk.createMany({ data: desks });

  return NextResponse.json(room, { status: 201 });
}
