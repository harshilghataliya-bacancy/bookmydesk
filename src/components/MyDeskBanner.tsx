"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface MyDeskBannerProps {
  deskNumber: number;
  roomName: string;
  sectionLabel: string;
  floorName: string;
}

export default function MyDeskBanner({
  deskNumber,
  roomName,
  sectionLabel,
  floorName,
}: MyDeskBannerProps) {
  return (
    <Link
      href="/dashboard/my-desk"
      className="group block animate-fade-in"
    >
      <div className="relative rounded-xl border border-green-200 bg-gradient-to-r from-green-50 via-emerald-50/50 to-green-50 px-5 py-4 overflow-hidden">
        {/* Decorative dots */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.06]">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-green-900" />
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-desk-mine text-white shadow-sm shrink-0">
            <CheckCircle2 size={22} strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-green-900">
              You&apos;re all set!
            </p>
            <p className="text-[13px] text-green-700 mt-0.5 truncate">
              Desk {deskNumber} &middot; {roomName} &middot; {sectionLabel} &middot;{" "}
              {floorName}
            </p>
          </div>
          <ArrowRight
            size={18}
            className="text-green-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all shrink-0"
          />
        </div>
      </div>
    </Link>
  );
}
