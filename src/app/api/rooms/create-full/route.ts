import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, forbidden, badRequest } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const body = await req.json();
  const { floorId, newFloorName, sectionId, newSectionLabel, roomName, rows, cols } = body;

  if (!roomName || !rows || !cols) {
    return badRequest("roomName, rows, and cols are required");
  }

  if (!floorId && !newFloorName) {
    return badRequest("Either floorId or newFloorName is required");
  }

  if (!sectionId && !newSectionLabel) {
    return badRequest("Either sectionId or newSectionLabel is required");
  }

  if (rows < 1 || cols < 1 || rows > 50 || cols > 50) {
    return badRequest("Rows and cols must be between 1 and 50");
  }

  try {
    // Resolve or create floor
    let resolvedFloorId = floorId;
    if (!resolvedFloorId && newFloorName) {
      const floor = await prisma.floor.create({
        data: { name: newFloorName.trim() },
      });
      resolvedFloorId = floor.id;
    }

    // Resolve or create section
    let resolvedSectionId = sectionId;
    if (!resolvedSectionId && newSectionLabel) {
      const section = await prisma.section.create({
        data: { floorId: resolvedFloorId, label: newSectionLabel.trim() },
      });
      resolvedSectionId = section.id;
    }

    // Create room
    const room = await prisma.room.create({
      data: {
        sectionId: resolvedSectionId,
        name: roomName.trim(),
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

    return NextResponse.json(
      {
        id: room.id,
        name: room.name,
        rows: room.rows,
        cols: room.cols,
        floorId: resolvedFloorId,
        sectionId: resolvedSectionId,
        totalDesks: rows * cols,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create room error:", error);
    return badRequest("Failed to create room. Check your inputs.");
  }
}
