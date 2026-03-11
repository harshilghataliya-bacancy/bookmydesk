import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, forbidden } from "@/lib/api-utils";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const count = await prisma.user.count();

  return NextResponse.json({ count });
}
