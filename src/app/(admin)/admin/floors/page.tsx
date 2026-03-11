"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface Floor {
  id: string;
  name: string;
  displayOrder: number;
  totalDesks: number;
  bookedDesks: number;
  availableDesks: number;
}

export default function AdminFloorsPage() {
  const router = useRouter();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newOrder, setNewOrder] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const fetchFloors = async () => {
    const res = await fetch("/api/floors");
    const data = await res.json();
    setFloors(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFloors();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await fetch("/api/floors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, displayOrder: newOrder }),
    });
    setNewName("");
    setNewOrder(0);
    setShowAdd(false);
    setToast("Floor added");
    fetchFloors();
    router.refresh();
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    await fetch(`/api/floors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });
    setEditingId(null);
    setToast("Floor renamed");
    fetchFloors();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/floors/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setToast(data.error || "Cannot delete floor");
      return;
    }
    setToast("Floor deleted");
    fetchFloors();
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
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-6">
        <Link href="/admin" className="text-slate-400 hover:text-brand transition-colors font-medium">
          Admin
        </Link>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-slate-800 font-semibold">Floors</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Manage Floors
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {floors.length} {floors.length === 1 ? "floor" : "floors"} configured
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add Floor
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mb-4 p-4 rounded-xl border border-brand-light bg-brand-mist animate-fade-in">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Floor Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Floor 3"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                autoFocus
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Order
              </label>
              <input
                type="number"
                value={newOrder}
                onChange={(e) => setNewOrder(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <button
              onClick={handleAdd}
              className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Floor list */}
      <div className="space-y-2">
        {floors.map((floor) => (
          <div
            key={floor.id}
            className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-card"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand shrink-0">
              <Building2 size={20} strokeWidth={1.8} />
            </div>

            <div className="flex-1 min-w-0">
              {editingId === floor.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-brand text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(floor.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <button
                    onClick={() => handleRename(floor.id)}
                    className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {floor.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {floor.totalDesks} desks &middot; {floor.bookedDesks} booked
                    &middot; Order: {floor.displayOrder}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Link
                href={`/admin/floors/${floor.id}/sections`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand hover:bg-brand-light transition-colors"
              >
                Sections
              </Link>
              <button
                onClick={() => {
                  setEditingId(floor.id);
                  setEditName(floor.name);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand-light transition-colors"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(floor.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {floors.length === 0 && (
          <div className="text-center py-12 rounded-xl border border-dashed border-slate-200 bg-white">
            <Building2 size={36} className="mx-auto text-slate-300 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-slate-500">No floors yet. Add your first floor above.</p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
          <div className="px-4 py-3 rounded-xl shadow-lg border border-slate-200 bg-white text-sm font-medium text-slate-700">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
