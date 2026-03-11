import Link from "next/link";
import { ShieldX, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-red-50/20 to-slate-50">
      <div className="w-full max-w-md text-center animate-fade-in">
        <div className="flex justify-center mb-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 border border-red-100">
            <ShieldX size={32} className="text-red-500" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Access Restricted
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-xs mx-auto">
          This application is only available to Bacancy Technology employees.
          Please sign in with your{" "}
          <span className="font-semibold text-slate-700">@bacancy.com</span>{" "}
          Google account.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition-colors shadow-sm"
        >
          <ArrowLeft size={16} />
          Back to Login
        </Link>
      </div>
    </div>
  );
}
