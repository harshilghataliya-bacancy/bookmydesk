import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import BookingConfirmCard from "@/components/BookingConfirmCard";
import { Armchair, ArrowRight } from "lucide-react";

export default async function MyDeskPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const booking = await prisma.booking.findUnique({
    where: { userId: session.user.id },
    include: {
      desk: {
        include: {
          room: {
            include: {
              section: { include: { floor: true } },
            },
          },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          My Desk
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Your hackathon desk booking details
        </p>
      </div>

      {booking ? (
        <BookingConfirmCard
          deskNumber={booking.desk.deskNumber}
          roomName={booking.desk.room.name}
          sectionLabel={booking.desk.room.section.label}
          floorName={booking.desk.room.section.floor.name}
          bookedAt={booking.bookedAt.toISOString()}
        />
      ) : (
        <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200 bg-white">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-light text-brand">
              <Armchair size={32} strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            No desk booked yet
          </h2>
          <p className="text-sm text-slate-500 mb-5 max-w-xs mx-auto">
            Browse the available floors and pick your perfect spot for the
            hackathon.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition-colors shadow-sm"
          >
            Browse Floors
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
