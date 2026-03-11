"use client";

import Link from "next/link";
import { Layers, ArrowRight } from "lucide-react";

interface SectionCardProps {
  id: string;
  label: string;
  floorId: string;
  roomCount: number;
  totalDesks: number;
  bookedDesks: number;
  availableDesks: number;
}

export default function SectionCard({
  id,
  label,
  floorId,
  roomCount,
  totalDesks,
  bookedDesks,
  availableDesks,
}: SectionCardProps) {
  const pct = totalDesks > 0 ? (bookedDesks / totalDesks) * 100 : 0;

  return (
    <Link
      href={`/dashboard/floors/${floorId}/sections/${id}`}
      className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-card card-hover"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
            <Layers size={18} strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">{label}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {roomCount} {roomCount === 1 ? "room" : "rooms"}
            </p>
          </div>
        </div>
        <ArrowRight
          size={16}
          className="text-slate-300 group-hover:text-brand group-hover:translate-x-0.5 transition-all mt-1"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>
            <span className="font-semibold text-desk-mine">{availableDesks}</span> free
          </span>
          <span className="text-slate-300">|</span>
          <span>
            <span className="font-semibold text-desk-booked">{bookedDesks}</span> taken
          </span>
        </div>
        <span className="text-[11px] font-mono font-medium text-slate-400">
          {Math.round(pct)}%
        </span>
      </div>

      <div className="mt-2 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}
