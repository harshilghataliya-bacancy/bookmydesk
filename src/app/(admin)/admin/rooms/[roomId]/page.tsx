"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Loader2,
  User,
  X,
  Lock,
  ShieldCheck,
  Unlock,
} from "lucide-react";

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

interface RoomData {
  id: string;
  name: string;
  rows: number;
  cols: number;
  sectionLabel: string;
  floorName: string;
  floorId: string;
  sectionId: string;
  desks: DeskData[];
}

export default function AdminRoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  const router = useRouter();
  const roomId = params.roomId;
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [freeing, setFreeing] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Reserve form
  const [startSeat, setStartSeat] = useState("");
  const [endSeat, setEndSeat] = useState("");
  const [reserving, setReserving] = useState(false);

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    const res = await fetch(`/api/rooms/${roomId}/desks`);
    const data = await res.json();
    setRoom(data);
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleFreeDesk = async (bookingId: string) => {
    setFreeing(bookingId);
    const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
    if (res.ok) {
      setToast("Desk freed successfully");
      fetchRoom();
      router.refresh();
    } else {
      setToast("Failed to free desk");
    }
    setFreeing(null);
  };

  const handleReserveRange = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseInt(startSeat);
    const end = parseInt(endSeat);
    if (isNaN(s) || isNaN(end)) return;

    setReserving(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/reserve-range`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startSeat: s, endSeat: end, action: "reserve" }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast(data.message);
        setStartSeat("");
        setEndSeat("");
        fetchRoom();
      } else {
        setToast(data.error || "Failed to reserve");
      }
    } catch {
      setToast("Failed to reserve");
    }
    setReserving(false);
  };

  const handleUnreserveRange = async () => {
    const s = parseInt(startSeat);
    const end = parseInt(endSeat);
    if (isNaN(s) || isNaN(end)) return;

    setReserving(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/reserve-range`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startSeat: s, endSeat: end, action: "unreserve" }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast(data.message);
        setStartSeat("");
        setEndSeat("");
        fetchRoom();
      } else {
        setToast(data.error || "Failed to unreserve");
      }
    } catch {
      setToast("Failed to unreserve");
    }
    setReserving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-brand" />
      </div>
    );
  }

  if (!room) return null;

  const deskMap = new Map<string, DeskData>();
  room.desks.forEach((d) => deskMap.set(`${d.row}-${d.col}`, d));

  let availCount = 0;
  let reservedCount = 0;
  let bookedCount = 0;
  room.desks.forEach((d) => {
    if (d.booking) bookedCount++;
    else if (d.isReserved) reservedCount++;
    else availCount++;
  });

  const maxSeat = room.rows * room.cols;

  function renderAdminDesk(col: number, rowIdx: number, chairSide: "left" | "right") {
    const desk = deskMap.get(`${rowIdx}-${col}`);
    if (!desk) {
      return <div className="w-[70px] h-[38px] sm:w-[76px] sm:h-[42px]" />;
    }

    const hasBooking = !!desk.booking;
    const isReserved = desk.isReserved && !hasBooking;
    const isFreeing = desk.booking && freeing === desk.booking.id;

    const PersonIcon = () => (
      <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
        <circle cx="9" cy="5" r="4" fill="white" />
        <path d="M1 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="white" strokeWidth="2" fill="none" />
      </svg>
    );

    const Chair = () => (
      <div className="flex-shrink-0 w-[14px] h-[28px] flex flex-col items-center justify-center">
        <div className="w-[10px] h-[10px] rounded-sm bg-slate-300 border border-slate-400/50" />
        <div className="w-[6px] h-[8px] bg-slate-300 border-x border-b border-slate-400/50 rounded-b-sm" />
      </div>
    );

    return (
      <div key={desk.id} className="relative group">
        <div className={`flex items-center gap-[3px]`}>
          {chairSide === "left" && <Chair />}
          <div
            className={`relative w-[52px] h-[38px] sm:w-[58px] sm:h-[42px] rounded-[4px] flex flex-col items-center justify-center border-[1.5px] ${
              hasBooking
                ? "bg-[#3B7DDD] border-[#2B6BC4]"
                : isReserved
                  ? "bg-amber-400 border-amber-500"
                  : "bg-white border-[#3B7DDD]"
            }`}
          >
            {hasBooking && (
              <div className="absolute inset-0 flex items-center justify-center">
                {desk.booking?.userAvatar ? (
                  <Image src={desk.booking.userAvatar} alt="" width={22} height={22} className="w-[22px] h-[22px] rounded-full border-2 border-white/50" />
                ) : (
                  <PersonIcon />
                )}
              </div>
            )}
            {isReserved && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock size={14} className="text-white" />
              </div>
            )}
            <span className={`relative z-10 font-bold font-mono leading-none ${
              hasBooking || isReserved ? "text-[9px] text-white/80 mt-auto mb-0.5" : "text-[11px] text-[#3B7DDD]"
            }`}>
              {desk.deskNumber}
            </span>
          </div>
          {chairSide === "right" && <Chair />}
        </div>

        {/* Hover popup for booked desks — shows below for first row, above for others */}
        {hasBooking && desk.booking && (
          rowIdx === 0 ? (
            <div className="absolute z-20 top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block animate-fade-in">
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-white" />
              <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  {desk.booking.userAvatar ? (
                    <Image src={desk.booking.userAvatar} alt="" width={28} height={28} className="w-7 h-7 rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center"><User size={12} /></div>
                  )}
                  <span className="text-xs font-semibold text-slate-800 truncate">{desk.booking.userName}</span>
                </div>
                <button
                  onClick={() => handleFreeDesk(desk.booking!.id)}
                  disabled={!!isFreeing}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                >
                  {isFreeing ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                  Free Desk
                </button>
              </div>
            </div>
          ) : (
            <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  {desk.booking.userAvatar ? (
                    <Image src={desk.booking.userAvatar} alt="" width={28} height={28} className="w-7 h-7 rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center"><User size={12} /></div>
                  )}
                  <span className="text-xs font-semibold text-slate-800 truncate">{desk.booking.userName}</span>
                </div>
                <button
                  onClick={() => handleFreeDesk(desk.booking!.id)}
                  disabled={!!isFreeing}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                >
                  {isFreeing ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                  Free Desk
                </button>
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-1.5 text-sm mb-6 flex-wrap">
        <Link href="/admin" className="text-slate-400 hover:text-brand transition-colors font-medium">Admin</Link>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-slate-800 font-semibold">{room.name}</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {room.name} — Admin View
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {room.floorName} &middot; {room.sectionLabel} &middot;{" "}
          {room.rows} &times; {room.cols} layout
        </p>
      </div>

      {/* Reserve Form */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <ShieldCheck size={16} className="text-amber-500" />
          Reserve Desks
        </h3>
        <form onSubmit={handleReserveRange} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Start Seat</label>
            <input
              type="number"
              min={1}
              max={maxSeat}
              value={startSeat}
              onChange={(e) => setStartSeat(e.target.value)}
              placeholder="1"
              className="w-24 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">End Seat</label>
            <input
              type="number"
              min={1}
              max={maxSeat}
              value={endSeat}
              onChange={(e) => setEndSeat(e.target.value)}
              placeholder="10"
              className="w-24 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
              required
            />
          </div>
          <button
            type="submit"
            disabled={reserving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-60"
          >
            {reserving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            Reserve
          </button>
          <button
            type="button"
            onClick={handleUnreserveRange}
            disabled={reserving || !startSeat || !endSeat}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            <Unlock size={14} />
            Unreserve
          </button>
          <span className="text-xs text-slate-400 self-center">
            Seats 1–{maxSeat} {startSeat && endSeat && startSeat === endSeat ? `(single desk ${startSeat})` : ""}
          </span>
        </form>
      </div>

      {/* Legend */}
      <div className="mb-5 inline-flex items-center gap-5 bg-white rounded-xl border border-slate-200 px-5 py-3 shadow-card">
        <div className="flex items-center gap-2">
          <div className="w-5 h-[14px] rounded-[3px] border-[1.5px] border-[#3B7DDD] bg-white" />
          <span className="text-xs font-medium text-slate-600">Available</span>
          <span className="text-xs font-bold text-[#3B7DDD] tabular-nums">{availCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-[14px] rounded-[3px] bg-amber-400 flex items-center justify-center">
            <Lock size={8} className="text-white" strokeWidth={3} />
          </div>
          <span className="text-xs font-medium text-slate-600">Reserved</span>
          <span className="text-xs font-bold text-amber-600 tabular-nums">{reservedCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-[14px] rounded-[3px] bg-[#3B7DDD] flex items-center justify-center">
            <User size={8} className="text-white" strokeWidth={3} />
          </div>
          <span className="text-xs font-medium text-slate-600">Booked</span>
          <span className="text-xs font-bold text-[#3B7DDD] tabular-nums">{bookedCount}</span>
        </div>
      </div>

      {/* Grid — paired desk layout */}
      <div className="overflow-x-auto pb-4">
        <div className="floor-plan-bg inline-block rounded-2xl p-6 sm:p-8 border border-blue-200/50">
          <div className="flex flex-col gap-2">
            {Array.from({ length: room.rows }).map((_, rowIdx) => {
              // Group columns into pairs
              const pairs: [number, number | null][] = [];
              for (let c = 0; c < room.cols; c += 2) {
                pairs.push([c, c + 1 < room.cols ? c + 1 : null]);
              }

              return (
                <div key={rowIdx} className="flex items-center gap-6 sm:gap-8">
                  {pairs.map(([leftCol, rightCol], pairIdx) => (
                    <div key={pairIdx} className="flex items-center gap-[6px]">
                      {renderAdminDesk(leftCol, rowIdx, "left")}
                      {rightCol !== null && renderAdminDesk(rightCol, rowIdx, "right")}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
          <div className="px-4 py-3 rounded-xl shadow-lg border border-slate-200 bg-white text-sm font-medium text-slate-700">{toast}</div>
        </div>
      )}
    </div>
  );
}
