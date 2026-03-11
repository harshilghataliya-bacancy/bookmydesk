import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import RoomCard from "@/components/RoomCard";
import { ChevronRight, DoorOpen } from "lucide-react";

export default async function SectionDetailPage({
  params,
}: {
  params: { floorId: string; sectionId: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { floorId, sectionId } = params;

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      floor: true,
      rooms: {
        include: {
          desks: {
            include: { booking: true },
          },
        },
      },
    },
  });

  if (!section || section.floorId !== floorId) notFound();

  const rooms = section.rooms.map((room) => {
    const activeDesks = room.desks.filter((d) => d.isActive);
    const bookedDesks = activeDesks.filter((d) => d.booking);
    return {
      id: room.id,
      name: room.name,
      rows: room.rows,
      cols: room.cols,
      totalDesks: activeDesks.length,
      bookedDesks: bookedDesks.length,
      availableDesks: activeDesks.length - bookedDesks.length,
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-6 flex-wrap">
        <Link
          href="/dashboard"
          className="text-slate-400 hover:text-brand transition-colors font-medium"
        >
          Dashboard
        </Link>
        <ChevronRight size={14} className="text-slate-300" />
        <Link
          href={`/dashboard/floors/${floorId}`}
          className="text-slate-400 hover:text-brand transition-colors font-medium"
        >
          {section.floor.name}
        </Link>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-slate-800 font-semibold">{section.label}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {section.label}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {rooms.length} {rooms.length === 1 ? "room" : "rooms"} &middot;{" "}
          {section.floor.name}
        </p>
      </div>

      {/* Rooms Grid */}
      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {rooms.map((room) => (
            <RoomCard key={room.id} {...room} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-xl border border-dashed border-slate-200 bg-white">
          <DoorOpen
            size={40}
            className="mx-auto text-slate-300 mb-3"
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium text-slate-500">
            No rooms in this section yet
          </p>
        </div>
      )}
    </div>
  );
}
