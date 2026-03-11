"use client";

import Link from "next/link";
import { DoorOpen, Grid3X3 } from "lucide-react";

interface RoomCardProps {
  id: string;
  name: string;
  rows: number;
  cols: number;
  totalDesks: number;
  bookedDesks: number;
  availableDesks: number;
}

export default function RoomCard({
  id,
  name,
  rows,
  cols,
  totalDesks,
  bookedDesks,
  availableDesks,
}: RoomCardProps) {
  const isFull = availableDesks === 0 && totalDesks > 0;

  return (
    <Link
      href={`/dashboard/rooms/${id}`}
      className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-card card-hover"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
            <DoorOpen size={18} strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">{name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Grid3X3 size={11} className="text-slate-400" />
              <span className="text-xs text-slate-400">
                {rows} &times; {cols} grid
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini grid preview */}
      <div className="mb-3 flex justify-center">
        <div
          className="inline-grid gap-[2px]"
          style={{
            gridTemplateColumns: `repeat(${Math.min(cols, 8)}, 1fr)`,
          }}
        >
          {Array.from({ length: Math.min(rows * cols, 32) }).map((_, i) => {
            const isBooked = i < bookedDesks;
            return (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-[2px] ${
                  isBooked ? "bg-desk-booked/60" : "bg-brand-light"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Availability chip */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
            isFull
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-700"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isFull ? "bg-red-500" : "bg-green-500"
            }`}
          />
          {isFull
            ? "Full"
            : `${availableDesks} / ${totalDesks} available`}
        </span>
      </div>
    </Link>
  );
}
