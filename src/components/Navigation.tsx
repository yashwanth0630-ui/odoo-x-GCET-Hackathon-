"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  Package,
  Shield,
  Warehouse,
  LogOut,
  Sparkles,
} from "lucide-react";

interface NavUser {
  name: string;
  email: string;
  role: string;
  roleLabel: string;
}

export default function Navigation({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isManager = user.role === "INVENTORY_MANAGER";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
      router.refresh();
    } catch {
      router.push("/auth/login");
    }
  };

  const navLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      name: "Products & Stock",
      href: "/products",
      icon: Package,
      active: pathname.startsWith("/products"),
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Navigation Links */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-mono">
                  Stock<span className="text-indigo-400">Sense</span>
                </span>
                <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    link.active
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Role Badge, User & Logout */}
        <div className="flex items-center gap-3">
          {/* Active Role Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isManager
                ? "bg-indigo-950/60 text-indigo-300 border-indigo-500/30"
                : "bg-emerald-950/60 text-emerald-300 border-emerald-500/30"
            }`}
          >
            {isManager ? (
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <Warehouse className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{user.roleLabel}</span>
          </div>

          {/* User Profile Pill */}
          <div className="hidden md:flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs">
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-indigo-300 font-bold flex items-center justify-center border border-white/10 uppercase">
              {user.name.slice(0, 2)}
            </div>
            <div className="text-left">
              <p className="font-semibold text-white leading-tight">{user.name}</p>
              <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">
                {user.email}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            id="nav-logout-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs border border-white/10 transition-all"
            title="Log out of session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
