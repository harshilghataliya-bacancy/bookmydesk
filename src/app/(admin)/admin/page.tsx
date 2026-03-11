"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  DoorOpen,
  Armchair,
  ClipboardList,
  Plus,
  X,
  Loader2,
  Lock,
  User,
  Check,
  Users,
  Search,
  Trash2,
  Pencil,
} from "lucide-react";

interface EmpSearchResult {
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  deskNumber: number;
  roomName: string;
  sectionLabel: string;
  floorName: string;
  roomId: string;
}

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

interface FloorOption {
  id: string;
  name: string;
}

interface SectionOption {
  id: string;
  label: string;
}

export default function AdminDashboard() {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterFloor, setFilterFloor] = useState("");
  const [filterSection, setFilterSection] = useState("");

  // Employee search
  const [empSearch, setEmpSearch] = useState("");
  const [empResults, setEmpResults] = useState<EmpSearchResult[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const empTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Form state
  const [floors, setFloors] = useState<FloorOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [rowsStr, setRowsStr] = useState("9");
  const [colsStr, setColsStr] = useState("8");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Derived numeric values (fallback to 1 for calculations)
  const rows = Math.max(1, Math.min(50, Number(rowsStr) || 0));
  const cols = Math.max(1, Math.min(50, Number(colsStr) || 0));

  // Edit state
  const [editRoom, setEditRoom] = useState<RoomItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editFloorId, setEditFloorId] = useState("");
  const [editSectionId, setEditSectionId] = useState("");
  const [editRowsStr, setEditRowsStr] = useState("9");
  const [editColsStr, setEditColsStr] = useState("8");
  const editRows = Math.max(1, Math.min(50, Number(editRowsStr) || 0));
  const editCols = Math.max(1, Math.min(50, Number(editColsStr) || 0));
  const [editSections, setEditSections] = useState<SectionOption[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchRooms = async () => {
    const res = await fetch("/api/rooms/all");
    if (res.ok) {
      const data = await res.json();
      setRooms(data);
    }
    setLoading(false);
  };

  const fetchFloors = async () => {
    const res = await fetch("/api/floors");
    if (res.ok) {
      const data = await res.json();
      setFloors(data.map((f: { id: string; name: string }) => ({ id: f.id, name: f.name })));
    }
  };

  const fetchSections = async (floorId: string) => {
    const res = await fetch(`/api/floors/${floorId}/sections`);
    if (res.ok) {
      const data = await res.json();
      setSections(data.map((s: { id: string; label: string }) => ({ id: s.id, label: s.label })));
    }
  };

  const fetchEmployeeCount = async () => {
    try {
      const res = await fetch("/api/users/count");
      if (res.ok) {
        const data = await res.json();
        setEmployeeCount(data.count);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchRooms();
    fetchFloors();
    fetchEmployeeCount();
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

  useEffect(() => {
    if (selectedFloorId) {
      fetchSections(selectedFloorId);
      setSelectedSectionId("");
    } else {
      setSections([]);
      setSelectedSectionId("");
    }
  }, [selectedFloorId]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Distinct floor/section names for filter dropdowns
  const floorNames = useMemo(
    () => Array.from(new Set(rooms.map((r) => r.floorName))).sort(),
    [rooms]
  );
  const sectionLabels = useMemo(() => {
    const src = filterFloor ? rooms.filter((r) => r.floorName === filterFloor) : rooms;
    return Array.from(new Set(src.map((r) => r.sectionLabel))).sort();
  }, [rooms, filterFloor]);

  // Reset section when floor changes
  useEffect(() => { setFilterSection(""); }, [filterFloor]);

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

  // Stats
  const totalDesks = rooms.reduce((s, r) => s + r.totalDesks, 0);
  const totalBooked = rooms.reduce((s, r) => s + r.bookedDesks, 0);
  const totalReserved = rooms.reduce((s, r) => s + r.reservedDesks, 0);
  const totalAvailable = totalDesks - totalBooked - totalReserved;
  const uniqueFloors = new Set(rooms.map((r) => r.floorId)).size;

  const resetForm = () => {
    setSelectedFloorId("");
    setSelectedSectionId("");
    setRoomName("");
    setRowsStr("9");
    setColsStr("8");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/rooms/create-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          floorId: selectedFloorId,
          sectionId: selectedSectionId,
          roomName,
          rows,
          cols,
        }),
      });
      if (res.ok) {
        setToast(`Room "${roomName}" created with ${rows * cols} desks!`);
        setShowForm(false);
        resetForm();
        fetchRooms();
      } else {
        const data = await res.json();
        setToast(data.error || "Failed to create room");
      }
    } catch {
      setToast("Failed to create room");
    }
    setSubmitting(false);
  };

  const handleDeleteRoom = async (roomId: string, roomNameStr: string) => {
    setDeleting(roomId);
    try {
      const res = await fetch(`/api/rooms/${roomId}`, { method: "DELETE" });
      if (res.ok) {
        setToast(`"${roomNameStr}" deleted`);
        fetchRooms();
      } else {
        const data = await res.json();
        setToast(data.error || "Failed to delete room");
      }
    } catch {
      setToast("Failed to delete room");
    }
    setDeleting(null);
  };

  const openEdit = async (room: RoomItem) => {
    setEditRoom(room);
    setEditName(room.name);
    setEditFloorId(room.floorId);
    setEditRowsStr(String(room.rows));
    setEditColsStr(String(room.cols));
    // Fetch sections for the room's floor
    const res = await fetch(`/api/floors/${room.floorId}/sections`);
    if (res.ok) {
      const data = await res.json();
      setEditSections(data.map((s: { id: string; label: string }) => ({ id: s.id, label: s.label })));
    }
    setEditSectionId(room.sectionId);
  };

  const handleEditFloorChange = async (floorId: string) => {
    setEditFloorId(floorId);
    setEditSectionId("");
    if (floorId) {
      const res = await fetch(`/api/floors/${floorId}/sections`);
      if (res.ok) {
        const data = await res.json();
        setEditSections(data.map((s: { id: string; label: string }) => ({ id: s.id, label: s.label })));
      }
    } else {
      setEditSections([]);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoom) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/rooms/${editRoom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, sectionId: editSectionId, rows: editRows, cols: editCols }),
      });
      if (res.ok) {
        setToast(`Room updated`);
        setEditRoom(null);
        fetchRooms();
      } else {
        const data = await res.json();
        setToast(data.error || "Failed to update");
      }
    } catch {
      setToast("Failed to update");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage rooms and reserve desks for the hackathon
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/bookings"
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ClipboardList size={16} />
            Bookings
          </Link>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Room
          </button>
        </div>
      </div>

      {/* Compact Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatPill icon={Users} label="Employees" value={employeeCount} color="text-indigo-600 bg-indigo-50" />
        <StatPill icon={Building2} label="Floors" value={uniqueFloors || floors.length} color="text-blue-600 bg-blue-50" />
        <StatPill icon={DoorOpen} label="Rooms" value={rooms.length} color="text-cyan-600 bg-cyan-50" />
        <StatPill icon={Armchair} label="Total Desks" value={totalDesks} color="text-purple-600 bg-purple-50" />
        <StatPill icon={Check} label="Available" value={totalAvailable} color="text-green-600 bg-green-50" />
        <StatPill icon={User} label="Booked" value={totalBooked + totalReserved} color="text-red-500 bg-red-50" />
      </div>

      {/* Filters — single row: Find Employee | Search Rooms */}
      <div className="flex items-center gap-3 mb-5 relative">
        {/* Find Employee */}
        <div className="relative flex-1 min-w-0">
          <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={empSearch}
            onChange={(e) => setEmpSearch(e.target.value)}
            placeholder="Find employee..."
            className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
          />
          {empSearch && (
            <button onClick={() => { setEmpSearch(""); setEmpResults([]); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
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
                      href={`/admin/rooms/${r.roomId}`}
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

      {/* Room Cards — grouped by floor → section */}
      {filtered.length > 0 ? (
        <div className="space-y-10 stagger-children">
          {Array.from(groupedByFloor.entries()).map(([floorName, sectionMap]) => (
            <div key={floorName}>
              {/* Floor heading with line */}
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">
                  {floorName}
                </h2>
                <div className="flex-1 h-px bg-slate-100" />
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
                          <div key={room.id} className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-card card-hover overflow-hidden">
                            <Link href={`/admin/rooms/${room.id}`} className="block">
                              {/* Top accent line on hover */}
                              <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />

                              <div className="flex items-start justify-between mb-3">
                                <h4 className="text-sm font-bold text-slate-800 group-hover:text-brand transition-colors truncate">
                                  {room.name}
                                </h4>
                                <div className="flex items-center gap-1.5 ml-2">
                                  {/* Grid size — hides on hover */}
                                  <span className="text-[10px] text-slate-400 font-mono group-hover:hidden">
                                    {room.rows}&times;{room.cols}
                                  </span>
                                  {/* Edit & Delete — shows on hover */}
                                  <div className="hidden group-hover:flex items-center gap-1">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); openEdit(room); }}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand-light transition-colors"
                                      title="Edit room"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteRoom(room.id, room.name); }}
                                      disabled={deleting === room.id}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                      title="Delete room"
                                    >
                                      {deleting === room.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    </button>
                                  </div>
                                </div>
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
                                    room.availableDesks === 0 ? "bg-slate-300" : "bg-brand"
                                  }`}
                                  style={{ width: `${occupiedPercent}%` }}
                                />
                              </div>
                            </Link>
                          </div>
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
          <p className="text-sm font-medium text-slate-400 mb-3">
            {rooms.length === 0 ? "No rooms yet — add your first room" : "No rooms match your filters"}
          </p>
          {rooms.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition-colors"
            >
              <Plus size={16} />
              Add Room
            </button>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="mt-6 flex items-center gap-3 text-sm">
        <Link href="/admin/bookings" className="text-slate-400 hover:text-brand transition-colors font-medium underline underline-offset-2">
          All Bookings
        </Link>
      </div>

      {/* ====== Add Room Modal ====== */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => { setShowForm(false); resetForm(); }}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10"
            >
              <X size={18} />
            </button>

            <div className="h-1 bg-brand" />

            <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Add New Room</h3>
              <p className="text-xs text-slate-400 mb-5">
                Select floor &amp; section, then configure the room layout
              </p>

              {/* Floor */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Floor</label>
                <select
                  value={selectedFloorId}
                  onChange={(e) => setSelectedFloorId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  required
                >
                  <option value="">Select a floor...</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Section</label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  disabled={!selectedFloorId}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">{!selectedFloorId ? "Select a floor first" : "Select a section..."}</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Room Name */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Room A, Conference Hall"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  required
                />
              </div>

              {/* Rows & Cols */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Rows</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={rowsStr}
                    onChange={(e) => setRowsStr(e.target.value)}
                    onBlur={() => { if (!rowsStr || Number(rowsStr) < 1) setRowsStr("1"); }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Columns</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={colsStr}
                    onChange={(e) => setColsStr(e.target.value)}
                    onBlur={() => { if (!colsStr || Number(colsStr) < 1) setColsStr("1"); }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    required
                  />
                </div>
              </div>

              {/* Desk Layout Preview — uses real DeskCell */}
              <DeskLayoutPreview rows={rows} cols={cols} />

              {/* Submit */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Creating...</>
                  ) : (
                    <><Plus size={16} /> Create Room</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== Edit Room Modal ====== */}
      {editRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setEditRoom(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 animate-scale-in overflow-hidden">
            <button
              onClick={() => setEditRoom(null)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10"
            >
              <X size={18} />
            </button>
            <div className="h-1 bg-brand" />
            <form onSubmit={handleSaveEdit} className="px-6 pt-5 pb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Edit Room</h3>
              <p className="text-xs text-slate-400 mb-5">
                Update room details, layout, or move to a different floor/section
              </p>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Room Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Floor</label>
                <select
                  value={editFloorId}
                  onChange={(e) => handleEditFloorChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  required
                >
                  <option value="">Select a floor...</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Section</label>
                <select
                  value={editSectionId}
                  onChange={(e) => setEditSectionId(e.target.value)}
                  disabled={!editFloorId}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50"
                  required
                >
                  <option value="">Select a section...</option>
                  {editSections.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Rows & Cols */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Rows</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={editRowsStr}
                    onChange={(e) => setEditRowsStr(e.target.value)}
                    onBlur={() => { if (!editRowsStr || Number(editRowsStr) < 1) setEditRowsStr("1"); }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Columns</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={editColsStr}
                    onChange={(e) => setEditColsStr(e.target.value)}
                    onBlur={() => { if (!editColsStr || Number(editColsStr) < 1) setEditColsStr("1"); }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    required
                  />
                </div>
              </div>

              {(editRows !== editRoom.rows || editCols !== editRoom.cols) && editRoom.bookedDesks > 0 && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium">
                  ⚠ Changing dimensions will fail if this room has active bookings.
                </div>
              )}

              {/* Desk Layout Preview */}
              <DeskLayoutPreview rows={editRows} cols={editCols} />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditRoom(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
          <div className="px-4 py-3 rounded-xl shadow-lg border border-slate-200 bg-white text-sm font-medium text-slate-700">{toast}</div>
        </div>
      )}
    </div>
  );
}

function DeskLayoutPreview({ rows, cols }: { rows: number; cols: number }) {
  const totalDesks = rows * cols;

  // Column-wise numbering: col 0 → 1..rows, col 1 → rows+1..2*rows, etc.
  const deskNum = (rowIdx: number, colIdx: number) => colIdx * rows + rowIdx + 1;

  // Pair columns: [0,1], [2,3], ...
  const pairs: [number, number | null][] = [];
  for (let c = 0; c < cols; c += 2) {
    pairs.push([c, c + 1 < cols ? c + 1 : null]);
  }

  // Fixed size calculated to fit 10 cols comfortably
  // If cols > 10, same size but horizontal scroll appears
  const sizeCols = Math.min(cols, 10);
  const numPairs10 = Math.ceil(sizeCols / 2);
  const numFull10 = Math.floor(sizeCols / 2);
  const hasOdd10 = sizeCols % 2;

  const AVAILABLE = 408;
  const CHAIR_R = 0.25;
  const INNER_GAP = 2;
  const PAIR_GAP = 6;

  const coeff = numFull10 * (2 * CHAIR_R + 2) + hasOdd10 * (CHAIR_R + 1);
  const fixed = numFull10 * 3 * INNER_GAP + hasOdd10 * INNER_GAP + Math.max(0, numPairs10 - 1) * PAIR_GAP;
  const computed = Math.floor((AVAILABLE - fixed) / (coeff || 1));
  const deskW = Math.max(14, Math.min(36, computed));
  const deskH = Math.round(deskW * 0.68);
  const chairW = Math.max(4, Math.round(deskW * CHAIR_R));
  const chairH = Math.round(chairW * 1.5);
  const fontSize = deskW >= 28 ? 8 : deskW >= 20 ? 7 : 6;
  const rowGap = 3;

  const needsScroll = cols > 10;

  return (
    <div className="mb-5 rounded-xl bg-slate-50 border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500">Desk Layout Preview</span>
        <span className="text-xs font-bold text-brand font-mono">{totalDesks} desks</span>
      </div>
      <div className={`floor-plan-bg rounded-xl p-3 border border-blue-200/50 ${needsScroll ? "overflow-x-auto" : ""}`}>
        <div className="flex flex-col" style={{ gap: rowGap, width: "max-content" }}>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex items-center" style={{ gap: PAIR_GAP }}>
              {pairs.map(([leftCol, rightCol], pairIdx) => (
                <div key={pairIdx} className="flex items-center" style={{ gap: INNER_GAP }}>
                  <div className="rounded-[1px] bg-slate-300 flex-shrink-0" style={{ width: chairW, height: chairH }} />
                  <div
                    className="rounded-[2px] bg-white border border-[#3B7DDD] flex items-center justify-center flex-shrink-0"
                    style={{ width: deskW, height: deskH }}
                  >
                    <span className="text-[#3B7DDD] font-bold font-mono leading-none" style={{ fontSize }}>
                      {deskNum(rowIdx, leftCol)}
                    </span>
                  </div>
                  {rightCol !== null && (
                    <>
                      <div
                        className="rounded-[2px] bg-white border border-[#3B7DDD] flex items-center justify-center flex-shrink-0"
                        style={{ width: deskW, height: deskH }}
                      >
                        <span className="text-[#3B7DDD] font-bold font-mono leading-none" style={{ fontSize }}>
                          {deskNum(rowIdx, rightCol)}
                        </span>
                      </div>
                      <div className="rounded-[1px] bg-slate-300 flex-shrink-0" style={{ width: chairW, height: chairH }} />
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-card">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
        <Icon size={16} strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-lg font-bold text-slate-900 font-mono leading-none">{value}</p>
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
      </div>
    </div>
  );
}
