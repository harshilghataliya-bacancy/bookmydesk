"use client";

import { useState } from "react";
import { Armchair, X, Loader2, MapPin } from "lucide-react";

interface BookingModalProps {
  deskNumber: number;
  roomName: string;
  sectionLabel: string;
  floorName: string;
  isReservedForMe?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function BookingModal({
  deskNumber,
  roomName,
  sectionLabel,
  floorName,
  isReservedForMe,
  onConfirm,
  onCancel,
}: BookingModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={!loading ? onCancel : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[380px] border border-slate-200 animate-scale-in overflow-hidden">
        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10"
        >
          <X size={18} />
        </button>

        {/* Header accent bar */}
        <div className={`h-1 ${isReservedForMe ? "bg-desk-reserved" : "bg-brand"}`} />

        {/* Content */}
        <div className="px-6 pt-5 pb-4">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {isReservedForMe ? "Confirm Reservation" : "Create Booking"}
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            {isReservedForMe
              ? "This desk was reserved for you by an admin"
              : "Booking for myself"}
          </p>

          {/* Desk info card */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                isReservedForMe ? "bg-desk-reserved" : "bg-brand"
              } text-white shadow-sm`}>
                <Armchair size={24} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    A-{deskNumber}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                  <MapPin size={11} />
                  <span>{floorName} &middot; {sectionLabel} &middot; {roomName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm ${
              isReservedForMe
                ? "bg-desk-reserved hover:bg-desk-reserved-deep"
                : "bg-brand hover:bg-brand-deep"
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {isReservedForMe ? "Confirming..." : "Booking..."}
              </>
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
