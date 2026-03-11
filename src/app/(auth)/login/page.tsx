"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Armchair, AlertCircle } from "lucide-react";
import { Suspense, useState } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard", redirect: true });
    } catch (e) {
      console.error("Sign in error:", e);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-fine opacity-40" />

      {/* Floating decorative shapes */}
      <div className="absolute top-20 left-[10%] w-8 h-8 rounded-lg border-2 border-brand/10 rotate-12 animate-pulse" />
      <div className="absolute top-40 right-[15%] w-6 h-6 rounded border-2 border-brand/8 -rotate-6" />
      <div className="absolute bottom-32 left-[20%] w-10 h-10 rounded-lg border-2 border-green-300/20 rotate-45" />
      <div className="absolute bottom-20 right-[25%] w-5 h-5 rounded border-2 border-red-300/15 -rotate-12" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-green-400/5 rounded-full blur-3xl" />

      <div className="relative w-full max-w-[400px] animate-fade-in">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-brand via-brand-deep to-brand" />

          <div className="px-8 pt-8 pb-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
                  <Armchair size={24} strokeWidth={2} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    BookMyDesk
                  </h1>
                  <p className="text-[11px] font-medium tracking-widest uppercase text-slate-400 -mt-0.5">
                    Bacancy Technology
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-sm text-slate-500 leading-relaxed">
                Pick your desk for the hackathon.
                <br />
                Sign in with your Bacancy account to get started.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">
                  {error === "AccessDenied"
                    ? "Access restricted to Bacancy employees. Please use your @bacancy.com account."
                    : error === "Configuration"
                    ? "Authentication configuration error. Please contact admin."
                    : "Something went wrong. Please try again."}
                </p>
              </div>
            )}

            {/* Sign in button */}
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 group disabled:opacity-60"
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-slate-300 border-t-brand rounded-full" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    Sign in with Google
                  </span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-slate-400 mt-4">
              Only <span className="font-semibold text-slate-500">@bacancy.com</span> accounts are allowed
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-4">
          &copy; {new Date().getFullYear()} Bacancy Technology
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
