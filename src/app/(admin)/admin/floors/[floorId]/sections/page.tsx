"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Plus,
  Trash2,
  ChevronRight,
  Loader2,
  Building2,
} from "lucide-react";

interface Section {
  id: string;
  label: string;
  floorId: string;
  roomCount: number;
  totalDesks: number;
  bookedDesks: number;
  availableDesks: number;
}

export default function AdminSectionsPage({
  params,
}: {
  params: { floorId: string };
}) {
  const router = useRouter();
  const floorId = params.floorId;
  const [floorName, setFloorName] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!floorId) return;
    const [floorsRes, sectionsRes] = await Promise.all([
      fetch("/api/floors"),
      fetch(`/api/floors/${floorId}/sections`),
    ]);
    const floors = await floorsRes.json();
    const floor = floors.find((f: { id: string; name: string }) => f.id === floorId);
    if (floor) setFloorName(floor.name);
    const data = await sectionsRes.json();
    setSections(data);
    setLoading(false);
  }, [floorId]);

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
    if (!newLabel.trim()) return;
    await fetch("/api/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ floorId, label: newLabel }),
    });
    setNewLabel("");
    setShowAdd(false);
    setToast("Section added");
    fetchData();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/sections/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setToast(data.error || "Cannot delete");
      return;
    }
    setToast("Section deleted");
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
        <span className="text-slate-800 font-semibold">{floorName || "Sections"}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Sections — {floorName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{sections.length} sections</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add Section
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 p-4 rounded-xl border border-brand-light bg-brand-mist animate-fade-in">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Section Label</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder='e.g. "15th Side"'
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <button onClick={handleAdd} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition-colors">
              Save
            </button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sections.map((section) => (
          <div key={section.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 shrink-0">
              <Layers size={20} strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{section.label}</p>
              <p className="text-xs text-slate-400">{section.roomCount} rooms &middot; {section.totalDesks} desks &middot; {section.bookedDesks} booked</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Link
                href={`/admin/sections/${section.id}/rooms`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand hover:bg-brand-light transition-colors"
              >
                Rooms
              </Link>
              <button
                onClick={() => handleDelete(section.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {sections.length === 0 && (
          <div className="text-center py-12 rounded-xl border border-dashed border-slate-200 bg-white">
            <Building2 size={36} className="mx-auto text-slate-300 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-slate-500">No sections yet. Add your first section.</p>
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
