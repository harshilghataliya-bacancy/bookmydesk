"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DoorOpen,
  Plus,
  Trash2,
  ChevronRight,
  Loader2,
  Grid3X3,
} from "lucide-react";

interface Room {
  id: string;
  name: string;
  sectionId: string;
  rows: number;
  cols: number;
  totalDesks: number;
  bookedDesks: number;
  availableDesks: number;
}

export default function AdminRoomsPage({
  params,
}: {
  params: { sectionId: string };
}) {
  const router = useRouter();
  const sectionId = params.sectionId;
  const [sectionLabel, setSectionLabel] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRows, setNewRows] = useState(3);
  const [newCols, setNewCols] = useState(5);
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!sectionId) return;
    const res = await fetch(`/api/sections/${sectionId}/rooms`);
    const data = await res.json();
    setRooms(data);

    // Get section label - fetch from a room's parent or from sections endpoint
    // We'll just show the ID for now and set it from rooms data if available
    setSectionLabel(`Section`);
    setLoading(false);
  }, [sectionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId,
        name: newName,
        rows: newRows,
        cols: newCols,
      }),
    });
    if (res.ok) {
      setNewName("");
      setNewRows(3);
      setNewCols(5);
      setShowAdd(false);
      setToast(`Room added with ${newRows * newCols} desks`);
      fetchData();
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/rooms/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setToast(data.error || "Cannot delete");
      return;
    }
    setToast("Room deleted");
    fetchData();
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-1.5 text-sm mb-6">
        <Link href="/admin" className="text-slate-400 hover:text-brand transition-colors font-medium">Admin</Link>
        <ChevronRight size={14} className="text-slate-300" />
        <Link href="/admin/floors" className="text-slate-400 hover:text-brand transition-colors font-medium">Floors</Link>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-slate-800 font-semibold">{sectionLabel} — Rooms</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Manage Rooms
          </h1>
          <p className="text-sm text-slate-500 mt-1">{rooms.length} rooms</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add Room
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 p-4 rounded-xl border border-brand-light bg-brand-mist animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Room Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder='e.g. "Room A"'
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Rows</label>
              <input
                type="number"
                min={1}
                value={newRows}
                onChange={(e) => setNewRows(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Columns</label>
              <input
                type="number"
                min={1}
                value={newCols}
                onChange={(e) => setNewCols(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            This will auto-generate <span className="font-semibold">{newRows * newCols} desks</span>
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition-colors">
              Create Room
            </button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rooms.map((room) => (
          <div key={room.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 shrink-0">
              <DoorOpen size={20} strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{room.name}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Grid3X3 size={11} />
                <span>{room.rows} &times; {room.cols}</span>
                <span>&middot;</span>
                <span>{room.totalDesks} desks &middot; {room.bookedDesks} booked</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Link
                href={`/admin/rooms/${room.id}`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand hover:bg-brand-light transition-colors"
              >
                View Grid
              </Link>
              <button
                onClick={() => handleDelete(room.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {rooms.length === 0 && (
          <div className="text-center py-12 rounded-xl border border-dashed border-slate-200 bg-white">
            <DoorOpen size={36} className="mx-auto text-slate-300 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-slate-500">No rooms yet. Add your first room.</p>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
          <div className="px-4 py-3 rounded-xl shadow-lg border border-slate-200 bg-white text-sm font-medium text-slate-700">{toast}</div>
        </div>
      )}
    </div>
  );
}
