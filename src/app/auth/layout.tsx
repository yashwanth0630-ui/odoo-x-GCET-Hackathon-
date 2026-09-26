import React from "react";
import Link from "next/link";
import { Boxes, ShieldCheck, Cpu } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#080c14] relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-600/10 blur-[140px] pointer-events-none" />
      
      {/* Top Header */}
      <header className="relative z-10 w-full px-6 py-6 border-b border-white/5 bg-[#0b0f19]/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
                Stock<span className="text-indigo-400">Sense</span>
                <span className="text-[10px] tracking-widest uppercase font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  IMS Core
                </span>
              </span>
              <p className="text-xs text-slate-400">Next-Gen Real-Time Stock Telemetry</p>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>JWT & Session Protected</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Prisma ORM • PostgreSQL Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-4 border-t border-white/5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>StockSense IMS &bull; Replacing manual registers with real-time accuracy</span>
          <span>Role-Based Access: Inventory Managers &amp; Warehouse Staff</span>
        </div>
      </footer>
    </div>
  );
}
