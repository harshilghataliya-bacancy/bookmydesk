import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, forbidden, notFound } from "@/lib/api-utils";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const { id } = params;

  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) return notFound("Booking not found");

  await prisma.booking.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
