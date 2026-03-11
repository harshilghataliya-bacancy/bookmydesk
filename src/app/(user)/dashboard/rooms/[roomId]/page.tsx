"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DeskGrid from "@/components/DeskGrid";
import BookingModal from "@/components/BookingModal";
import { ArrowLeft, Loader2, Info } from "lucide-react";

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

export default function RoomMapPage({
  params,
}: {
  params: { roomId: string };
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDesk, setSelectedDesk] = useState<{
    id: string;
    number: number;
    isReservedForMe: boolean;
  } | null>(null);
  const [userHasBooked, setUserHasBooked] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const roomId = params.roomId;

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}/desks`);
      if (!res.ok) throw new Error("Failed to load room");
      const data = await res.json();
      setRoom(data);

      const mineRes = await fetch("/api/bookings/mine");
      const mineData = await mineRes.json();
      // User has a confirmed (non-reserved) booking
      setUserHasBooked(!!mineData && !mineData.isReserved);
    } catch {
      setError("Failed to load room data");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  const handleDeskSelect = (deskId: string, deskNumber: number) => {
    if (!session?.user?.id || !room) return;

    // Check if this desk is reserved for the current user
    const desk = room.desks.find((d) => d.id === deskId);
    const isReservedForMe =
      desk?.booking?.isReserved && desk?.booking?.userId === session.user.id;

    setSelectedDesk({
      id: deskId,
      number: deskNumber,
      isReservedForMe: !!isReservedForMe,
    });
  };

  const handleBooking = async () => {
    if (!selectedDesk || !session?.user) return;

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deskId: selectedDesk.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        setToast({ type: "error", message: data.error });
        setSelectedDesk(null);
        return;
      }

      setToast({
        type: "success",
        message: selectedDesk.isReservedForMe
          ? `Desk ${selectedDesk.number} confirmed!`
          : `Desk ${selectedDesk.number} booked successfully!`,
      });
      setSelectedDesk(null);
      setUserHasBooked(true);
      await fetchRoom();
      router.refresh();
    } catch {
      setToast({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
      setSelectedDesk(null);
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-brand" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-red-500">{error || "Room not found"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Back to Dashboard */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-brand transition-colors font-medium mb-6"
      >
        <ArrowLeft size={15} />
        Dashboard
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {room.name}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {room.floorName} &middot; {room.sectionLabel} &middot;{" "}
          {room.rows} &times; {room.cols} layout
        </p>
      </div>

      {/* View-only notice — compact */}
      {userHasBooked && (
        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-xs text-slate-500">
          <Info size={12} />
          You already have a desk booked
        </div>
      )}

      {/* Desk Grid */}
      <DeskGrid
        desks={room.desks}
        roomRows={room.rows}
        roomCols={room.cols}
        currentUserId={session?.user?.id || ""}
        userHasBooked={userHasBooked}
        onDeskSelect={handleDeskSelect}
      />

      {/* Booking Modal */}
      {selectedDesk && (
        <BookingModal
          deskNumber={selectedDesk.number}
          roomName={room.name}
          sectionLabel={room.sectionLabel}
          floorName={room.floorName}
          isReservedForMe={selectedDesk.isReservedForMe}
          onConfirm={handleBooking}
          onCancel={() => setSelectedDesk(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
