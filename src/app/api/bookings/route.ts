import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, unauthorized, forbidden, conflict, badRequest } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();

  const body = await req.json();
  const { deskId } = body;

  if (!deskId) return badRequest("deskId is required");

  // Use a serializable transaction to prevent race conditions
  // when two users try to book the same desk simultaneously
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Check if user already has a booking
      const existingBooking = await tx.booking.findUnique({
        where: { userId: session.user.id },
        include: { desk: true },
      });

      if (existingBooking) {
        return {
          error: true,
          response: conflict(
            `You have already booked Desk ${existingBooking.desk.deskNumber}. Your booking cannot be changed.`
          ),
        };
      }

      // Check if desk is already booked or reserved
      const deskBooking = await tx.booking.findUnique({
        where: { deskId },
      });

      if (deskBooking) {
        if (deskBooking.isReserved && deskBooking.userId === session.user.id) {
          // This desk is reserved for this user — convert to confirmed booking
          const confirmed = await tx.booking.update({
            where: { id: deskBooking.id },
            data: { isReserved: false },
            include: {
              desk: {
                include: {
                  room: { include: { section: { include: { floor: true } } } },
                },
              },
            },
          });
          return { error: false, booking: confirmed, status: 200 };
        }
        return {
          error: true,
          response: conflict(
            deskBooking.isReserved
              ? "This desk is reserved by an admin. Please choose another."
              : "This desk was just booked by someone else. Please choose another."
          ),
        };
      }

      // Check desk exists, is active, and not reserved by admin
      const desk = await tx.desk.findUnique({
        where: { id: deskId },
      });

      if (!desk || !desk.isActive) {
        return { error: true, response: badRequest("Invalid desk") };
      }

      if (desk.isReserved) {
        return {
          error: true,
          response: conflict("This desk is reserved by admin and cannot be booked."),
        };
      }

      const booking = await tx.booking.create({
        data: {
          deskId,
          userId: session.user.id,
        },
        include: {
          desk: {
            include: {
              room: {
                include: {
                  section: {
                    include: { floor: true },
                  },
                },
              },
            },
          },
        },
      });

      return { error: false, booking, status: 201 };
    }, {
      isolationLevel: "Serializable",
    });

    if (result.error) return result.response!;
    return NextResponse.json(result.booking, { status: result.status });
  } catch {
    return conflict("This desk was just booked by someone else. Please try another.");
  }
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const bookings = await prisma.booking.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      desk: {
        include: {
          room: {
            include: {
              section: {
                include: { floor: true },
              },
            },
          },
        },
      },
    },
    orderBy: { bookedAt: "desc" },
  });

  const result = bookings.map((b) => ({
    id: b.id,
    userName: b.user.name,
    userEmail: b.user.email,
    userAvatar: b.user.avatarUrl,
    deskNumber: b.desk.deskNumber,
    roomName: b.desk.room.name,
    sectionLabel: b.desk.room.section.label,
    floorName: b.desk.room.section.floor.name,
    floorId: b.desk.room.section.floor.id,
    sectionId: b.desk.room.section.id,
    roomId: b.desk.room.id,
    isReserved: b.isReserved,
    bookedAt: b.bookedAt,
  }));

  return NextResponse.json(result);
}
