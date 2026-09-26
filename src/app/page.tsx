import Link from "next/link";
import {
  Boxes,
  ShieldCheck,
  Warehouse,
  ArrowRight,
  Sparkles,
  Layers,
  Database,
  Lock,
  Zap,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  Activity,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#221D1A] text-[#e8ddd4] flex flex-col relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-[#AD543C]/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[700px] h-[700px] rounded-full bg-[#988879]/10 blur-[160px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full border-b border-[#C3B4AA]/8 bg-[#241f1b]/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#AD543C] to-[#d4886e] flex items-center justify-center shadow-lg shadow-[#AD543C]/25">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
                Stock<span className="text-[#AD543C]">Sense</span>
              </span>
              <p className="text-[11px] text-[#988879]">Modular Real-Time IMS</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                id="header-dashboard-link"
                className="px-4 py-2 rounded-xl bg-[#AD543C] hover:bg-[#c06244] text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#AD543C]/30 transition-all"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  id="header-login-link"
                  className="px-4 py-2 rounded-xl bg-[#584D44]/80 hover:bg-[#6E655C] text-[#C3B4AA] text-xs font-semibold border border-[#C3B4AA]/10 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  id="header-signup-link"
                  className="px-4 py-2 rounded-xl bg-[#AD543C] hover:bg-[#c06244] text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-[#AD543C]/30 transition-all"
                >
                  <span>Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 text-center max-w-5xl mx-auto space-y-10">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#AD543C]/10 border border-[#AD543C]/30 text-[#e0a08a] text-xs font-medium shadow-inner animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-[#AD543C]" />
          <span>Task 1 Architecture &bull; RBAC &bull; OTP Verification &bull; PostgreSQL &amp; Prisma</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Replace Manual Registers with{" "}
            <span className="gradient-text">Real-Time Precision</span>
          </h1>
          <p className="text-base sm:text-lg text-[#988879] max-w-2xl mx-auto font-light leading-relaxed">
            StockSense is a modular, high-performance inventory management system engineered to eradicate
            paper tally books, reconcile warehouse movements in real-time, and enforce role-based operational controls.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/auth/login"
            id="hero-get-started-btn"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#AD543C] to-[#c06244] hover:from-[#c06244] hover:to-[#d4886e] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#AD543C]/30 hover:shadow-[#AD543C]/50 transition-all duration-200 group"
          >
            <span>Launch StockSense Cockpit</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/auth/signup"
            id="hero-signup-btn"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#584D44]/80 hover:bg-[#6E655C] text-[#C3B4AA] font-semibold text-sm border border-[#C3B4AA]/10 flex items-center justify-center gap-2 transition-all duration-200"
          >
            <span>Create Staff Account</span>
          </Link>
        </div>

        {/* Comparison: Manual Register vs StockSense */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-6">
          {/* Legacy Manual Registers */}
          <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 bg-rose-950/10">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-3">
              <FileSpreadsheet className="w-5 h-5" />
              <span>Legacy Manual Registers (The Problem)</span>
            </div>
            <ul className="space-y-2.5 text-xs text-[#988879]">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">&times;</span>
                <span>Handwritten logbooks prone to illegible handwriting and data loss</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">&times;</span>
                <span>Zero real-time inventory visibility across distributed facilities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">&times;</span>
                <span>Unverified physical counts leading to stockouts and phantom stock</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">&times;</span>
                <span>Lack of audit trails or accountability for item adjustments</span>
              </li>
            </ul>
          </div>

          {/* StockSense Modular IMS */}
          <div className="glass-panel p-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/10">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-3">
              <Activity className="w-5 h-5" />
              <span>StockSense Modular IMS (The Solution)</span>
            </div>
            <ul className="space-y-2.5 text-xs text-[#C3B4AA]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Centralized, real-time digital ledger with instant sync</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Role-Based Access for Inventory Managers &amp; Warehouse Staff</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero-trust authentication with JWT, bcrypt hashing &amp; 6-digit OTP reset</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Prisma ORM schema with PostgreSQL production migrations</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Roles Showcase */}
        <div className="w-full pt-8">
          <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-center">
            Role-Based Operational Matrix
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* Inventory Manager */}
            <div className="glass-panel p-6 rounded-2xl border border-[#AD543C]/30 bg-[#2e2823]/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-[#AD543C]/10 text-[#AD543C] border border-[#AD543C]/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Inventory Managers</h3>
                  <p className="text-xs text-[#e0a08a]">Administrative &amp; Executive Oversight</p>
                </div>
              </div>
              <p className="text-xs text-[#988879] leading-relaxed mb-4">
                Oversee multi-warehouse valuation, inspect automated low-stock warnings, approve stock requisitions, and audit tamper-proof system logs.
              </p>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-[#e0a08a]">
                <span className="px-2 py-1 rounded bg-[#AD543C]/10 border border-[#AD543C]/30">Valuation Analytics</span>
                <span className="px-2 py-1 rounded bg-[#AD543C]/10 border border-[#AD543C]/30">Stock Adjustments</span>
                <span className="px-2 py-1 rounded bg-[#AD543C]/10 border border-[#AD543C]/30">Audit Logs</span>
                <span className="px-2 py-1 rounded bg-[#AD543C]/10 border border-[#AD543C]/30">Team Management</span>
              </div>
            </div>

            {/* Warehouse Staff */}
            <div className="glass-panel p-6 rounded-2xl border border-[#6E655C]/30 bg-[#2e2823]/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-[#6E655C]/15 text-[#C3B4AA] border border-[#6E655C]/20">
                  <Warehouse className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Warehouse Staff</h3>
                  <p className="text-xs text-[#C3B4AA]">Floor Execution &amp; Ledger Operations</p>
                </div>
              </div>
              <p className="text-xs text-[#988879] leading-relaxed mb-4">
                Execute barcode check-ins, record supplier shipment receipts, pick and dispatch outbound packages, and record cycle counts on the warehouse floor.
              </p>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-[#C3B4AA]">
                <span className="px-2 py-1 rounded bg-[#6E655C]/15 border border-[#6E655C]/30">Barcode Intake</span>
                <span className="px-2 py-1 rounded bg-[#6E655C]/15 border border-[#6E655C]/30">Dispatch Verification</span>
                <span className="px-2 py-1 rounded bg-[#6E655C]/15 border border-[#6E655C]/30">Cycle Counting</span>
                <span className="px-2 py-1 rounded bg-[#6E655C]/15 border border-[#6E655C]/30">Defect Quarantine</span>
              </div>
            </div>
          </div>
        </div>

        {/* Architecture Tech Stack Badges */}
        <div className="pt-6 border-t border-[#C3B4AA]/8 w-full flex flex-wrap items-center justify-center gap-3 text-xs text-[#988879]">
          <span className="px-3 py-1.5 rounded-lg bg-[#C3B4AA]/5 border border-[#C3B4AA]/10 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#AD543C]" />
            Next.js 16 App Router
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-[#C3B4AA]/5 border border-[#C3B4AA]/10 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Prisma ORM (PostgreSQL &amp; SQLite)
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-[#C3B4AA]/5 border border-[#C3B4AA]/10 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#C3B4AA]" />
            Tailwind CSS v3.4
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-[#C3B4AA]/5 border border-[#C3B4AA]/10 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Edge JWT &bull; Bcrypt &bull; 6-Digit OTP
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-6 border-t border-[#C3B4AA]/8 text-center text-xs text-[#6E655C]">
        <p>&copy; {new Date().getFullYear()} StockSense IMS &bull; Centralized Real-Time Inventory Control</p>
      </footer>
    </div>
  );
}
