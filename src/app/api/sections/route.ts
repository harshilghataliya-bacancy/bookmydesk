import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, forbidden, badRequest } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const body = await req.json();
  const { floorId, label } = body;

  if (!floorId || !label) return badRequest("floorId and label are required");

  const section = await prisma.section.create({
    data: { floorId, label },
  });

  return NextResponse.json(section, { status: 201 });
}
