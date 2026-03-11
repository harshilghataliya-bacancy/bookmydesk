import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const bookings = await prisma.booking.findMany({
    where: {
      user: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
    },
    include: {
      user: { select: { name: true, email: true, avatarUrl: true } },
      desk: {
        include: {
          room: { include: { section: { include: { floor: true } } } },
        },
      },
    },
    take: 10,
  });

  const result = bookings.map((b) => ({
    userName: b.user.name,
    userEmail: b.user.email,
    userAvatar: b.user.avatarUrl,
    deskNumber: b.desk.deskNumber,
    roomName: b.desk.room.name,
    sectionLabel: b.desk.room.section.label,
    floorName: b.desk.room.section.floor.name,
    roomId: b.desk.room.id,
  }));

  return NextResponse.json(result);
}
