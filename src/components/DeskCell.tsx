"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

export type DeskState = "available" | "booked" | "reserved" | "mine" | "disabled";

interface DeskCellProps {
  deskNumber: number;
  state: DeskState;
  chairSide: "left" | "right";
  bookedUserName?: string;
  bookedUserAvatar?: string | null;
  onClick?: () => void;
  disabled?: boolean;
}

export default function DeskCell({
  deskNumber,
  state,
  chairSide,
  bookedUserName,
  bookedUserAvatar,
  onClick,
  disabled,
}: DeskCellProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; below: boolean } | null>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const isClickable = state === "available" && !disabled;
  const effectiveState = disabled && state === "available" ? "disabled" : state;

  const tooltipText =
    state === "available"
      ? `Desk ${deskNumber} — Click to book`
      : state === "booked"
        ? bookedUserName || "Booked"
        : state === "reserved"
          ? `Desk ${deskNumber} — Reserved`
          : state === "mine"
            ? "Your Desk"
            : "";

  useEffect(() => {
    if (showTooltip && cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const spaceAbove = rect.top;
      // If less than 40px above, show below
      const below = spaceAbove < 40;
      const y = below ? rect.bottom + 8 : rect.top - 8;
      setTooltipPos({ x: centerX, y, below });
    } else {
      setTooltipPos(null);
    }
  }, [showTooltip]);

  // Person silhouette SVG
  const PersonIcon = ({ color = "white" }: { color?: string }) => (
    <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
      <circle cx="9" cy="5" r="4" fill={color} />
      <path d="M1 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke={color} strokeWidth="2" fill="none" />
    </svg>
  );

  // Chair SVG
  const Chair = () => (
    <div className="flex-shrink-0 w-[14px] h-[28px] flex flex-col items-center justify-center">
      <div className="w-[10px] h-[10px] rounded-sm bg-slate-300 border border-slate-400/50" />
      <div className="w-[6px] h-[8px] bg-slate-300 border-x border-b border-slate-400/50 rounded-b-sm" />
    </div>
  );

  const deskColors: Record<DeskState, string> = {
    available: "bg-white border-[#3B7DDD] border-[1.5px]",
    booked: "bg-[#3B7DDD] border-[#2B6BC4] border-[1.5px]",
    reserved: "bg-amber-400 border-amber-500 border-[1.5px]",
    mine: "bg-[#1A6B5A] border-[#145A4C] border-[1.5px]",
    disabled: "bg-slate-100 border-slate-300 border-[1.5px] desk-hatched",
  };

  return (
    <div
      ref={cellRef}
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={isClickable ? onClick : undefined}
        disabled={!isClickable}
        className={`flex items-center gap-[3px] group transition-transform duration-150 ${
          isClickable ? "cursor-pointer hover:scale-105" : "cursor-default"
        } ${disabled && state === "available" ? "opacity-40" : ""}`}
      >
        {chairSide === "left" && <Chair />}
        <div
          className={`relative w-[52px] h-[38px] sm:w-[58px] sm:h-[42px] rounded-[4px] flex flex-col items-center justify-center ${deskColors[effectiveState]}`}
        >
          {/* Person icon for booked/mine states */}
          {(effectiveState === "booked" || effectiveState === "mine") && (
            <div className="absolute inset-0 flex items-center justify-center">
              {bookedUserAvatar ? (
                <Image
                  src={bookedUserAvatar}
                  alt=""
                  width={22}
                  height={22}
                  className="w-[22px] h-[22px] rounded-full border-2 border-white/50"
                />
              ) : (
                <PersonIcon />
              )}
            </div>
          )}

          {/* Lock icon for reserved */}
          {effectiveState === "reserved" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                <rect x="1" y="7" width="12" height="8" rx="2" fill="white" fillOpacity="0.9" />
                <path d="M4 7V5a3 3 0 116 0v2" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>
            </div>
          )}

          {/* Desk number */}
          <span
            className={`relative z-10 font-bold font-mono leading-none ${
              effectiveState === "available"
                ? "text-[11px] text-[#3B7DDD]"
                : effectiveState === "reserved"
                  ? "text-[9px] text-white/80 mt-auto mb-0.5"
                  : effectiveState === "disabled"
                    ? "text-[11px] text-slate-400"
                    : "text-[9px] text-white/80 mt-auto mb-0.5"
            }`}
          >
            {deskNumber}
          </span>
        </div>
        {chairSide === "right" && <Chair />}
      </button>

      {/* Tooltip — rendered via portal so it escapes overflow clipping */}
      {showTooltip && tooltipText && tooltipPos &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none animate-fade-in"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.below ? tooltipPos.y : undefined,
              bottom: tooltipPos.below ? undefined : `calc(100vh - ${tooltipPos.y}px)`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="relative bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg">
              {tooltipPos.below && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900" />
              )}
              {tooltipText}
              {!tooltipPos.below && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
              )}
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
}
