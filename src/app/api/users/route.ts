import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, forbidden } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const search = req.nextUrl.searchParams.get("search") || "";

  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      booking: { select: { id: true } },
    },
    orderBy: { name: "asc" },
    take: 20,
  });

  const result = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    hasBooking: !!u.booking,
  }));

  return NextResponse.json(result);
}
