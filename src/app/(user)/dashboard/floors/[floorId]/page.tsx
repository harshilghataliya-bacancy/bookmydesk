import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import SectionCard from "@/components/SectionCard";
import { ChevronRight, Layers } from "lucide-react";

export default async function FloorDetailPage({
  params,
}: {
  params: { floorId: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { floorId } = params;

  const floor = await prisma.floor.findUnique({
    where: { id: floorId },
    include: {
      sections: {
        include: {
          rooms: {
            include: {
              desks: {
                include: { booking: true },
              },
            },
          },
        },
      },
    },
  });

  if (!floor) notFound();

  const sections = floor.sections.map((section) => {
    let totalDesks = 0;
    let bookedDesks = 0;
    section.rooms.forEach((room) => {
      room.desks.forEach((desk) => {
        if (desk.isActive) {
          totalDesks++;
          if (desk.booking) bookedDesks++;
        }
      });
    });
    return {
      id: section.id,
      label: section.label,
      floorId: floor.id,
      roomCount: section.rooms.length,
      totalDesks,
      bookedDesks,
      availableDesks: totalDesks - bookedDesks,
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-6">
        <Link
          href="/dashboard"
          className="text-slate-400 hover:text-brand transition-colors font-medium"
        >
          Dashboard
        </Link>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-slate-800 font-semibold">{floor.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {floor.name}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {sections.length} {sections.length === 1 ? "section" : "sections"} in
          this floor
        </p>
      </div>

      {/* Sections Grid */}
      {sections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {sections.map((section) => (
            <SectionCard key={section.id} {...section} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-xl border border-dashed border-slate-200 bg-white">
          <Layers
            size={40}
            className="mx-auto text-slate-300 mb-3"
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium text-slate-500">
            No sections in this floor yet
          </p>
        </div>
      )}
    </div>
  );
}
