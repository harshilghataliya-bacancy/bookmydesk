"use client";

import { Armchair } from "lucide-react";

export default function Footer({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <footer className="border-t border-slate-200/60 bg-white/50 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Armchair size={14} />
            <span className="text-xs font-medium">
              BookMyDesk &middot; Bacancy Technology
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
