"use client";

import {
  CheckCircle2,
  Building2,
  Layers,
  DoorOpen,
  Armchair,
  Clock,
} from "lucide-react";

interface BookingConfirmCardProps {
  deskNumber: number;
  roomName: string;
  sectionLabel: string;
  floorName: string;
  bookedAt: string;
}

export default function BookingConfirmCard({
  deskNumber,
  roomName,
  sectionLabel,
  floorName,
  bookedAt,
}: BookingConfirmCardProps) {
  const date = new Date(bookedAt);
  const formatted = date.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="animate-fade-in">
      <div className="relative rounded-2xl border border-green-200 bg-white shadow-card overflow-hidden">
        {/* Header stripe */}
        <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <CheckCircle2 size={26} className="text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Booking Confirmed</h2>
              <p className="text-green-100 text-sm">Your desk is reserved for the hackathon</p>
            </div>
          </div>
        </div>

        {/* Desk number hero */}
        <div className="flex justify-center -mt-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white border-4 border-green-100 shadow-lg">
            <div className="text-center">
              <span className="text-2xl font-bold text-slate-900 font-mono">{deskNumber}</span>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider -mt-0.5">Desk</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 pt-4 pb-6">
          <div className="space-y-3">
            <DetailRow
              icon={<Building2 size={16} />}
              label="Floor"
              value={floorName}
              color="text-blue-600 bg-blue-50"
            />
            <DetailRow
              icon={<Layers size={16} />}
              label="Section"
              value={sectionLabel}
              color="text-indigo-600 bg-indigo-50"
            />
            <DetailRow
              icon={<DoorOpen size={16} />}
              label="Room"
              value={roomName}
              color="text-cyan-600 bg-cyan-50"
            />
            <DetailRow
              icon={<Armchair size={16} />}
              label="Desk"
              value={`Desk ${deskNumber}`}
              color="text-green-600 bg-green-50"
            />
            <div className="pt-2 border-t border-slate-100">
              <DetailRow
                icon={<Clock size={16} />}
                label="Booked at"
                value={formatted}
                color="text-slate-500 bg-slate-50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const [textColor, bgColor] = color.split(" ");
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgColor} ${textColor} shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}
