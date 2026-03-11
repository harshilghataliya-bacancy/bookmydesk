"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutGrid,
  LogOut,
  ShieldCheck,
  Armchair,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

interface NavbarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
  } | null;
  myBooking: {
    deskNumber: number;
    roomName: string;
    sectionLabel: string;
    floorName: string;
  } | null;
}

export default function Navbar({ user, myBooking }: NavbarProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";
  const isAdminRoute = pathname.startsWith("/admin");
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Armchair size={18} strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold tracking-tight text-slate-900 leading-tight">
                BookMyDesk
              </span>
              <span className="text-[10px] font-medium tracking-widest uppercase text-slate-400 leading-none">
                Bacancy
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {/* My Desk Banner */}
            {myBooking && (
              <Link
                href="/dashboard/my-desk"
                className="flex items-center gap-2 mr-2 px-3 py-1.5 rounded-full bg-desk-mine-soft border border-green-200 text-green-800 text-[13px] font-semibold transition-all hover:bg-green-100 hover:shadow-sm"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-desk-mine text-white text-[10px] font-bold">
                  {myBooking.deskNumber}
                </span>
                <span className="hidden lg:inline">
                  Desk {myBooking.deskNumber} &middot; {myBooking.roomName}
                </span>
                <span className="lg:hidden">My Desk</span>
              </Link>
            )}

            <NavLink
              href="/dashboard"
              active={pathname === "/dashboard"}
              icon={<LayoutGrid size={16} />}
            >
              Dashboard
            </NavLink>

            {isAdmin && (
              <NavLink
                href="/admin"
                active={isAdminRoute}
                icon={<ShieldCheck size={16} />}
                accent
              >
                Admin
              </NavLink>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Desktop user dropdown */}
            <div className="hidden md:block relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-100 focus-ring"
              >
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || "User"}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-lg object-cover border border-slate-200"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light text-brand text-xs font-bold border border-brand/10">
                    {initials}
                  </div>
                )}
                <div className="flex flex-col items-start">
                  <span className="text-[13px] font-semibold text-slate-800 leading-tight max-w-[120px] truncate">
                    {user.name || "User"}
                  </span>
                  <span className="text-[11px] text-slate-400 leading-tight">
                    {isAdmin ? "Admin" : "Employee"}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 animate-fade-in">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  {myBooking && (
                    <Link
                      href="/dashboard/my-desk"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Armchair size={15} className="text-desk-mine" />
                      <span>My Desk</span>
                    </Link>
                  )}
                  <button
                    onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: "/login" }); }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg hover:bg-slate-100 transition-colors focus-ring"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {myBooking && (
              <Link
                href="/dashboard/my-desk"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-desk-mine-soft border border-green-200 text-green-800 text-sm font-semibold mb-2"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-desk-mine text-white text-xs font-bold">
                  {myBooking.deskNumber}
                </span>
                Desk {myBooking.deskNumber} &middot; {myBooking.roomName} &middot;{" "}
                {myBooking.floorName}
              </Link>
            )}

            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "bg-brand-light text-brand"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <LayoutGrid size={18} />
              Dashboard
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isAdminRoute
                    ? "bg-amber-50 text-amber-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <ShieldCheck size={18} />
                Admin Panel
              </Link>
            )}

            <div className="pt-2 border-t border-slate-100 mt-2">
              <div className="flex items-center gap-3 px-3 py-2">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-lg object-cover border border-slate-200"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light text-brand text-xs font-bold">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({
  href,
  active,
  icon,
  children,
  accent,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: boolean;
}) {
  const base =
    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200";
  const activeStyle = accent
    ? "bg-amber-50 text-amber-700 shadow-sm"
    : "bg-brand-light text-brand shadow-sm";
  const inactiveStyle =
    "text-slate-500 hover:text-slate-800 hover:bg-slate-100";

  return (
    <Link href={href} className={`${base} ${active ? activeStyle : inactiveStyle}`}>
      {icon}
      {children}
    </Link>
  );
}
