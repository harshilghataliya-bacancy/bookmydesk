"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  DoorOpen,
  Loader2,
  ChevronRight,
  Lock,
  User,
  Search,
  Armchair,
  MapPin,
  X,
} from "lucide-react";

interface RoomItem {
  id: string;
  name: string;
  rows: number;
  cols: number;
  floorId: string;
  floorName: string;
  sectionId: string;
  sectionLabel: string;
  totalDesks: number;
  bookedDesks: number;
  reservedDesks: number;
  availableDesks: number;
}

interface MyBooking {
  id: string;
  deskNumber: number;
  roomName: string;
  roomId: string;
  sectionLabel: string;
  floorName: string;
  isReserved: boolean;
}

interface SearchResult {
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  deskNumber: number;
  roomName: string;
  sectionLabel: string;
  floorName: string;
  roomId: string;
}

export default function DashboardPage() {
  useSession();
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [myBooking, setMyBooking] = useState<MyBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterFloor, setFilterFloor] = useState("");
  const [filterSection, setFilterSection] = useState("");

  // Employee search
  const [empSearch, setEmpSearch] = useState("");
  const [empResults, setEmpResults] = useState<SearchResult[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const empTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [roomsRes, bookingRes] = await Promise.all([
          fetch("/api/rooms/all"),
          fetch("/api/bookings/mine"),
        ]);
        if (roomsRes.ok) setRooms(await roomsRes.json());
        if (bookingRes.ok) {
          const data = await bookingRes.json();
          setMyBooking(data);
        }
      } catch {
        // silently fail
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Debounced employee search
  useEffect(() => {
    if (empTimerRef.current) clearTimeout(empTimerRef.current);
    if (!empSearch.trim() || empSearch.trim().length < 2) {
      setEmpResults([]);
      return;
    }
    setEmpLoading(true);
    empTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/bookings/search?q=${encodeURIComponent(empSearch.trim())}`);
        if (res.ok) setEmpResults(await res.json());
      } catch { /* ignore */ }
      setEmpLoading(false);
    }, 300);
  }, [empSearch]);

  const floorNames = useMemo(
    () => Array.from(new Set(rooms.map((r) => r.floorName))).sort(),
    [rooms]
  );

  const sectionLabels = useMemo(() => {
    const filtered = filterFloor
      ? rooms.filter((r) => r.floorName === filterFloor)
      : rooms;
    return Array.from(new Set(filtered.map((r) => r.sectionLabel))).sort();
  }, [rooms, filterFloor]);

  // Reset section when floor changes
  useEffect(() => {
    setFilterSection("");
  }, [filterFloor]);

  const filtered = useMemo(() => {
    return rooms.filter((r) => {
      const matchSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.floorName.toLowerCase().includes(search.toLowerCase()) ||
        r.sectionLabel.toLowerCase().includes(search.toLowerCase());
      const matchFloor = !filterFloor || r.floorName === filterFloor;
      const matchSection = !filterSection || r.sectionLabel === filterSection;
      return matchSearch && matchFloor && matchSection;
    });
  }, [rooms, search, filterFloor, filterSection]);

  // Group by floor → section
  const groupedByFloor = useMemo(() => {
    const map = new Map<string, Map<string, RoomItem[]>>();
    filtered.forEach((r) => {
      if (!map.has(r.floorName)) map.set(r.floorName, new Map());
      const sectionMap = map.get(r.floorName)!;
      if (!sectionMap.has(r.sectionLabel)) sectionMap.set(r.sectionLabel, []);
      sectionMap.get(r.sectionLabel)!.push(r);
    });
    return map;
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Hackathon Hero Banner */}
      <div className="mb-8 rounded-2xl overflow-hidden relative" style={{ background: "#040f0e" }}>
        {/* Base gradient — exact poster teal */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 60% at 50% 50%, #1b6b5a 0%, #115c4a 20%, #0b4035 40%, #072a24 60%, #041a17 80%, #040f0e 100%)
            `,
          }}
        />
        {/* Dot grid — circuit texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(94,234,212,0.18) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        {/* Bright center glow */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 40% 45% at 50% 48%, rgba(32,180,155,0.18) 0%, transparent 100%)",
          }}
        />

        <div className="relative px-6 sm:px-10 py-12 sm:py-16 text-center">
          {/* Top badge */}
          <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#0a0a0a]/80 border border-white/[0.08] mb-7">
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-white/90">
              The Ultimate AI Battle Begins
            </span>
          </div>

          {/* Title */}
          <h2
            className="text-4xl sm:text-5xl lg:text-[4.2rem] font-black tracking-tight leading-[1.1] mb-4"
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #c8d6d4 50%, rgba(255,255,255,0.35) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            AI MAHAKURUKSHETRA
          </h2>

          {/* Tagline */}
          <p className="text-lg sm:text-xl font-medium tracking-wide text-white/65 mb-9">
            Think, Build, and Launch a Product.
          </p>

          {/* Date & Time */}
          <div className="inline-flex items-center gap-3 sm:gap-4 px-6 py-3.5 rounded-lg border border-[#5eead4]/15 bg-[#5eead4]/[0.03] mb-5">
            <span className="text-sm sm:text-base font-bold text-white">14 March 2026</span>
            <span className="w-px h-4 bg-white/15" />
            <span className="text-sm sm:text-base text-white/50">9:00 AM – 7:00 PM</span>
          </div>

          {/* Location */}
          <p className="text-sm text-white/30">
            Location: <span className="font-semibold text-white/55">Bacancy Technology</span>
          </p>
        </div>
      </div>

      {/* My Desk Banner */}
      {myBooking && (
        <Link
          href={`/dashboard/rooms/${myBooking.roomId}`}
          className="mb-8 flex items-center gap-4 px-5 py-4 rounded-xl bg-white border border-slate-200 shadow-card card-hover block"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 border border-green-100">
            <Armchair size={18} className="text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800">
              {myBooking.isReserved ? "Reserved for You" : "Your Desk"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <MapPin size={10} />
              Desk {myBooking.deskNumber} &middot; {myBooking.roomName} &middot;{" "}
              {myBooking.sectionLabel} &middot; {myBooking.floorName}
            </p>
          </div>
          <ChevronRight size={16} className="text-slate-300" />
        </Link>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Book a Desk
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Select a room to view available desks
        </p>
      </div>

      {/* Filters — single row: Find Colleague | Search Rooms | All Sections | All Floors */}
      <div className="flex items-center gap-3 mb-6 relative">
        {/* Find Colleague */}
        <div className="relative flex-1 min-w-0">
          <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={empSearch}
            onChange={(e) => setEmpSearch(e.target.value)}
            placeholder="Find colleague..."
            className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
          />
          {empSearch && (
            <button onClick={() => { setEmpSearch(""); setEmpResults([]); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
          {/* Colleague Search Dropdown */}
          {empSearch.trim().length >= 2 && (
            <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden min-w-[340px]">
              {empLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-brand" />
                </div>
              ) : empResults.length > 0 ? (
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                  {empResults.map((r, i) => (
                    <Link
                      key={i}
                      href={`/dashboard/rooms/${r.roomId}`}
                      onClick={() => { setEmpSearch(""); setEmpResults([]); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      {r.userAvatar ? (
                        <Image src={r.userAvatar} alt="" width={28} height={28} className="w-7 h-7 rounded-full border border-slate-200" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                          <User size={12} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{r.userName}</p>
                        <p className="text-xs text-slate-400 truncate">{r.userEmail}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-brand">Desk {r.deskNumber}</p>
                        <p className="text-[10px] text-slate-400">{r.roomName} &middot; {r.floorName}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">No employees found</div>
              )}
            </div>
          )}
        </div>
        {/* Search Rooms */}
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
          />
        </div>
        {/* Section filter */}
        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          className="filter-select px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shrink-0"
        >
          <option value="">All Sections</option>
          {sectionLabels.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {/* Floor filter */}
        <select
          value={filterFloor}
          onChange={(e) => setFilterFloor(e.target.value)}
          className="filter-select px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shrink-0"
        >
          <option value="">All Floors</option>
          {floorNames.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Room Cards — grouped by floor, sections side by side */}
      {filtered.length > 0 ? (
        <div className="space-y-10 stagger-children">
          {Array.from(groupedByFloor.entries()).map(([floorName, sectionMap]) => (
            <div key={floorName}>
              {/* Floor heading with line */}
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">
                  {floorName}
                </h2>
                <div className="flex-1 h-px bg-slate-150 bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {Array.from(sectionMap.entries()).map(([sectionLabel, sectionRooms]) => (
                  <div key={sectionLabel}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-0.5 h-3.5 rounded-full bg-brand" />
                      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {sectionLabel}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {sectionRooms.map((room) => {
                        const occupiedPercent =
                          room.totalDesks > 0
                            ? Math.round(((room.bookedDesks + room.reservedDesks) / room.totalDesks) * 100)
                            : 0;

                        return (
                          <Link
                            key={room.id}
                            href={`/dashboard/rooms/${room.id}`}
                            className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-card card-hover block overflow-hidden"
                          >
                            {/* Top accent line on hover */}
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />

                            <div className="flex items-start justify-between mb-3">
                              <h4 className="text-sm font-bold text-slate-800 group-hover:text-brand transition-colors truncate">
                                {room.name}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-mono ml-2 shrink-0">
                                {room.rows}&times;{room.cols}
                              </span>
                            </div>

                            {/* Availability numbers */}
                            <div className="flex items-baseline gap-1 mb-3">
                              <span className={`text-xl font-bold font-mono leading-none ${
                                room.availableDesks > 0 ? "text-slate-800" : "text-slate-300"
                              }`}>
                                {room.availableDesks}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                / {room.totalDesks} available
                              </span>
                              {room.reservedDesks > 0 && (
                                <span className="flex items-center gap-0.5 text-slate-400 text-[10px] ml-auto">
                                  <Lock size={8} />
                                  {room.reservedDesks}
                                </span>
                              )}
                            </div>

                            {/* Thin progress bar */}
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  room.availableDesks === 0
                                    ? "bg-slate-300"
                                    : "bg-brand"
                                }`}
                                style={{ width: `${occupiedPercent}%` }}
                              />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 rounded-xl border border-dashed border-slate-200 bg-white">
          <DoorOpen size={36} className="mx-auto text-slate-200 mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-slate-400">
            {rooms.length === 0
              ? "No rooms available yet"
              : "No rooms match your filters"}
          </p>
          {rooms.length === 0 && (
            <p className="text-xs text-slate-300 mt-1.5">
              Ask an admin to set up rooms for the hackathon
            </p>
          )}
        </div>
      )}
    </div>
  );
}
