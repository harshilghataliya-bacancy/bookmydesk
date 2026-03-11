"use client";

import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";

interface FloorCardProps {
  id: string;
  name: string;
  totalDesks: number;
  bookedDesks: number;
  availableDesks: number;
}

export default function FloorCard({
  id,
  name,
  totalDesks,
  bookedDesks,
  availableDesks,
}: FloorCardProps) {
  const pct = totalDesks > 0 ? (bookedDesks / totalDesks) * 100 : 0;
  const isFull = availableDesks === 0 && totalDesks > 0;

  return (
    <Link
      href={`/dashboard/floors/${id}`}
      className="group relative block rounded-xl border border-slate-200 bg-white p-5 shadow-card card-hover overflow-hidden"
    >
      {/* Subtle corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-brand-mist to-transparent rounded-bl-[40px] opacity-60" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand">
              <Building2 size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">{name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {totalDesks} {totalDesks === 1 ? "desk" : "desks"} total
              </p>
            </div>
          </div>
          <ArrowRight
            size={16}
            className="text-slate-300 group-hover:text-brand group-hover:translate-x-0.5 transition-all mt-1"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-desk-mine" />
            <span className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{availableDesks}</span>{" "}
              available
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-desk-booked" />
            <span className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{bookedDesks}</span>{" "}
              booked
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFull
                ? "bg-desk-booked"
                : pct > 75
                ? "bg-amber-400"
                : "bg-brand"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {isFull && (
          <p className="text-[11px] font-semibold text-desk-booked mt-1.5 tracking-wide uppercase">
            Fully booked
          </p>
        )}
      </div>
    </Link>
  );
}
