"use client";

import DeskCell, { DeskState } from "./DeskCell";
import { Lock, User, Check } from "lucide-react";

interface DeskData {
  id: string;
  deskNumber: number;
  row: number;
  col: number;
  isReserved: boolean;
  booking: {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string | null;
    isReserved: boolean;
    bookedAt: string;
  } | null;
}

interface DeskGridProps {
  desks: DeskData[];
  roomRows: number;
  roomCols: number;
  currentUserId: string;
  userHasBooked: boolean;
  onDeskSelect: (deskId: string, deskNumber: number) => void;
}

export default function DeskGrid({
  desks,
  roomRows,
  roomCols,
  currentUserId,
  userHasBooked,
  onDeskSelect,
}: DeskGridProps) {
  const deskMap = new Map<string, DeskData>();
  desks.forEach((desk) => {
    deskMap.set(`${desk.row}-${desk.col}`, desk);
  });

  // Count stats
  let available = 0;
  let reserved = 0;
  let booked = 0;
  desks.forEach((d) => {
    if (d.booking) booked++;
    else if (d.isReserved) reserved++;
    else available++;
  });

  // Group columns into pairs: [0,1], [2,3], [4,5], ...
  const pairs: [number, number | null][] = [];
  for (let c = 0; c < roomCols; c += 2) {
    pairs.push([c, c + 1 < roomCols ? c + 1 : null]);
  }

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="mb-5 inline-flex items-center gap-5 bg-white rounded-xl border border-slate-200 px-5 py-3 shadow-card">
        <LegendItem
          swatch={<div className="w-5 h-[14px] rounded-[3px] border-[1.5px] border-[#3B7DDD] bg-white" />}
          label="Available"
          count={available}
          color="text-[#3B7DDD]"
        />
        <LegendItem
          swatch={
            <div className="w-5 h-[14px] rounded-[3px] bg-amber-400 flex items-center justify-center">
              <Lock size={8} className="text-white" strokeWidth={3} />
            </div>
          }
          label="Reserved"
          count={reserved}
          color="text-amber-600"
        />
        <LegendItem
          swatch={
            <div className="w-5 h-[14px] rounded-[3px] bg-[#3B7DDD] flex items-center justify-center">
              <User size={8} className="text-white" strokeWidth={3} />
            </div>
          }
          label="Booked"
          count={booked}
          color="text-[#3B7DDD]"
        />
        <LegendItem
          swatch={
            <div className="w-5 h-[14px] rounded-[3px] bg-[#1A6B5A] flex items-center justify-center">
              <Check size={9} className="text-white" strokeWidth={3} />
            </div>
          }
          label="Your Desk"
          count={null}
          color="text-[#1A6B5A]"
        />
      </div>

      {/* Floor Plan */}
      <div className="overflow-x-auto pb-4">
        <div className="floor-plan-bg inline-block rounded-2xl p-6 sm:p-8 border border-blue-200/50">
          <div className="flex flex-col gap-2">
            {Array.from({ length: roomRows }).map((_, rowIdx) => (
              <div key={rowIdx} className="flex items-center gap-6 sm:gap-8">
                {pairs.map(([leftCol, rightCol], pairIdx) => (
                  <div key={pairIdx} className="flex items-center gap-[6px]">
                    {/* Left desk in pair — chair on left */}
                    {renderDesk(leftCol, rowIdx, "left")}
                    {/* Right desk in pair — chair on right */}
                    {rightCol !== null && renderDesk(rightCol, rowIdx, "right")}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  function renderDesk(col: number, row: number, chairSide: "left" | "right") {
    const desk = deskMap.get(`${row}-${col}`);
    if (!desk) {
      return <div className="w-[70px] h-[38px] sm:w-[76px] sm:h-[42px]" />;
    }

    let state: DeskState = "available";
    if (desk.booking) {
      state = desk.booking.userId === currentUserId ? "mine" : "booked";
    } else if (desk.isReserved) {
      state = "reserved";
    }

    return (
      <DeskCell
        key={desk.id}
        deskNumber={desk.deskNumber}
        state={state}
        chairSide={chairSide}
        bookedUserName={desk.booking?.userName}
        bookedUserAvatar={desk.booking?.userAvatar}
        onClick={() => onDeskSelect(desk.id, desk.deskNumber)}
        disabled={userHasBooked && state === "available"}
      />
    );
  }
}

function LegendItem({
  swatch,
  label,
  count,
  color,
}: {
  swatch: React.ReactNode;
  label: string;
  count: number | null;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {swatch}
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {count !== null && (
        <span className={`text-xs font-bold ${color} tabular-nums`}>{count}</span>
      )}
    </div>
  );
}
