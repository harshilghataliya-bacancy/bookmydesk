"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Trash2,
  User,
  ClipboardList,
  Download,
} from "lucide-react";

interface Booking {
  id: string;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  deskNumber: number;
  roomName: string;
  sectionLabel: string;
  floorName: string;
  floorId: string;
  sectionId: string;
  roomId: string;
  isReserved: boolean;
  bookedAt: string;
}

const PAGE_SIZE = 15;

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterFloor, setFilterFloor] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);

  const fetchBookings = async () => {
    const res = await fetch("/api/bookings");
    const data = await res.json();
    setBookings(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const floors = useMemo(
    () => Array.from(new Set(bookings.map((b) => b.floorName))).sort(),
    [bookings]
  );

  const sections = useMemo(() => {
    const src = filterFloor
      ? bookings.filter((b) => b.floorName === filterFloor)
      : bookings;
    return Array.from(new Set(src.map((b) => b.sectionLabel))).sort();
  }, [bookings, filterFloor]);

  const roomNames = useMemo(() => {
    let src = bookings;
    if (filterFloor) src = src.filter((b) => b.floorName === filterFloor);
    if (filterSection) src = src.filter((b) => b.sectionLabel === filterSection);
    return Array.from(new Set(src.map((b) => b.roomName))).sort();
  }, [bookings, filterFloor, filterSection]);

  // Reset cascading filters
  useEffect(() => { setFilterSection(""); setFilterRoom(""); }, [filterFloor]);
  useEffect(() => { setFilterRoom(""); }, [filterSection]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        !search ||
        b.userName.toLowerCase().includes(search.toLowerCase()) ||
        b.userEmail.toLowerCase().includes(search.toLowerCase());
      const matchFloor = !filterFloor || b.floorName === filterFloor;
      const matchSection = !filterSection || b.sectionLabel === filterSection;
      const matchRoom = !filterRoom || b.roomName === filterRoom;
      return matchSearch && matchFloor && matchSection && matchRoom;
    });
  }, [bookings, search, filterFloor, filterSection, filterRoom]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, filterFloor, filterSection, filterRoom]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFree = async (id: string) => {
    const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    if (res.ok) {
      setToast("Booking removed");
      fetchBookings();
      router.refresh();
    } else {
      setToast("Failed to remove booking");
    }
  };

  const exportCSV = () => {
    const header = ["Employee Name","Email","Floor","Section","Room","Desk","Status","Booked At"];
    const rows = filtered.map((b) => [
      b.userName,
      b.userEmail,
      b.floorName,
      b.sectionLabel,
      b.roomName,
      b.deskNumber,
      b.isReserved ? "Reserved" : "Booked",
      new Date(b.bookedAt).toLocaleString("en-IN"),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
      <nav className="flex items-center gap-1.5 text-sm mb-6">
        <Link href="/admin" className="text-slate-400 hover:text-brand transition-colors font-medium">Admin</Link>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-slate-800 font-semibold">Bookings</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            All Bookings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {bookings.length} total bookings
            {filtered.length !== bookings.length && ` — ${filtered.length} shown`}
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* Filters — all in one row */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-0">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <select
          value={filterFloor}
          onChange={(e) => setFilterFloor(e.target.value)}
          className="filter-select px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shrink-0"
        >
          <option value="">All Floors</option>
          {floors.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          className="filter-select px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shrink-0"
        >
          <option value="">All Sections</option>
          {sections.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterRoom}
          onChange={(e) => setFilterRoom(e.target.value)}
          className="filter-select px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shrink-0"
        >
          <option value="">All Rooms</option>
          {roomNames.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <>
          <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Floor
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                      Section
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Desk
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                      Booked At
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {b.userAvatar ? (
                            <Image
                              src={b.userAvatar}
                              alt=""
                              width={28}
                              height={28}
                              className="w-7 h-7 rounded-full border border-slate-200"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                              <User size={12} className="text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate text-sm">
                              {b.userName}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {b.userEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {b.floorName}
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                        {b.sectionLabel}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{b.roomName}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center h-6 w-8 rounded bg-brand-light text-brand text-xs font-bold font-mono">
                          {b.deskNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {b.isReserved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                            Reserved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
                            Booked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">
                        {new Date(b.bookedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleFree(b.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Free this desk"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-slate-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  // Show first, last, and pages around current
                  if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                          p === page
                            ? "bg-brand text-white"
                            : "text-slate-600 hover:bg-slate-50 border border-slate-200"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                  // Show ellipsis
                  if (p === page - 2 || p === page + 2) {
                    return <span key={p} className="text-slate-300 text-xs px-1">&hellip;</span>;
                  }
                  return null;
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 rounded-xl border border-dashed border-slate-200 bg-white">
          <ClipboardList
            size={40}
            className="mx-auto text-slate-300 mb-3"
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium text-slate-500">
            {bookings.length === 0
              ? "No bookings yet"
              : "No bookings match your filters"}
          </p>
        </div>
      )}

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
