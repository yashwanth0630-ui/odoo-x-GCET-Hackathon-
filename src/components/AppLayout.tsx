"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  Package,
  Layers,
  ArrowDownToLine,
  Truck,
  SlidersHorizontal,
  History,
  Building2,
  User as UserIcon,
  LogOut,
  ChevronDown,
  ChevronRight,
  Search,
  Shield,
  Warehouse,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

interface AppLayoutProps {
  user: {
    id?: string;
    name: string;
    email: string;
    role: string;
    roleLabel: string;
    department?: string | null;
    warehouseLocation?: string | null;
    permissions?: string[];
  };
  children: React.ReactNode;
}

export default function AppLayout({ user, children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [operationsOpen, setOperationsOpen] = useState<boolean>(true);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(
    pathname.startsWith("/settings")
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Global SKU Search
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const isManager = user.role === "INVENTORY_MANAGER";

  // Handle Global SKU Search
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!globalSearch.trim()) {
        setSearchResults([]);
        setSearchDropdownOpen(false);
        return;
      }

      setSearchLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(globalSearch.trim())}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.products.slice(0, 5));
          setSearchDropdownOpen(true);
        }
      } catch {
        // Ignore
      } finally {
        setSearchLoading(false);
      }
    };

    const timer = setTimeout(fetchSearchResults, 250);
    return () => clearTimeout(timer);
  }, [globalSearch]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
      router.refresh();
    } catch {
      router.push("/auth/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col md:flex-row relative">
      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ============================================================== */}
      {/* PERSISTENT LEFT SIDEBAR (Task 6 Specification) */}
      {/* ============================================================== */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0b0f19] border-r border-white/10 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top: Brand Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white font-mono flex items-center gap-1.5">
                Stock<span className="text-indigo-400">Sense</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  IMS
                </span>
              </span>
              <p className="text-[10px] text-slate-400">Modular Inventory Telemetry</p>
            </div>
          </Link>

          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Middle: Hierarchical Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 text-xs">
          {/* 1. Dashboard */}
          <Link
            href="/dashboard"
            onClick={() => setMobileSidebarOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all ${
              pathname === "/dashboard"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard</span>
          </Link>

          {/* 2. Products */}
          <Link
            href="/products"
            onClick={() => setMobileSidebarOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all ${
              pathname === "/products"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>Products</span>
          </Link>

          {/* 3. Operations (Dropdown / Sub-menu) */}
          <div className="pt-2">
            <button
              onClick={() => setOperationsOpen(!operationsOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-slate-300">Operations</span>
              </div>
              {operationsOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {operationsOpen && (
              <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-1">
                {/* Receipts */}
                <Link
                  href="/operations/receipts"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                    pathname === "/operations/receipts"
                      ? "text-indigo-400 font-semibold bg-indigo-500/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>Receipts (Incoming)</span>
                </Link>

                {/* Delivery Orders */}
                <Link
                  href="/operations/deliveries"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                    pathname === "/operations/deliveries"
                      ? "text-indigo-400 font-semibold bg-indigo-500/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Delivery Orders</span>
                </Link>

                {/* Inventory Adjustment */}
                <Link
                  href="/operations/adjustments"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                    pathname === "/operations/adjustments"
                      ? "text-indigo-400 font-semibold bg-indigo-500/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Inventory Adjustment</span>
                </Link>

                {/* Move History / Centralized Ledger */}
                <Link
                  href="/operations/move-history"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                    pathname === "/operations/move-history"
                      ? "text-indigo-400 font-semibold bg-indigo-500/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Move History (Ledger)</span>
                </Link>
              </div>
            )}
          </div>

          {/* 4. Settings (Warehouse configuration) */}
          <div className="pt-2">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-300">Settings</span>
              </div>
              {settingsOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {settingsOpen && (
              <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-1">
                <Link
                  href="/settings/warehouses"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                    pathname === "/settings/warehouses"
                      ? "text-emerald-400 font-semibold bg-emerald-500/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>Warehouse Configuration</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Profile Menu & Logout */}
        <div className="p-3 border-t border-white/10 bg-slate-950/40 space-y-2">
          {/* User Card */}
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center border border-indigo-500/20 uppercase shrink-0 text-xs">
                {user.name.slice(0, 2)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 border ${
                    isManager
                      ? "bg-indigo-950 text-indigo-300 border-indigo-500/30"
                      : "bg-emerald-950 text-emerald-300 border-emerald-500/30"
                  }`}
                >
                  {user.roleLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Actions: My Profile & Logout */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setProfileModalOpen(true)}
              id="sidebar-my-profile-btn"
              className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
            >
              <UserIcon className="w-3 h-3" />
              <span>My Profile</span>
            </button>
            <button
              onClick={handleLogout}
              id="sidebar-logout-btn"
              className="py-1.5 px-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-[11px] font-medium flex items-center justify-center gap-1 border border-rose-500/20 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* TOP HEADER BAR & MAIN CONTENT WRAPPER */}
      {/* ============================================================== */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Header Bar with Global SKU Search */}
        <header className="sticky top-0 z-30 h-16 border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global SKU Search Bar */}
            <div ref={searchRef} className="relative w-64 sm:w-80 md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="global-sku-search"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Global SKU Search (e.g. SKU-9921, Servo)..."
                className="glass-input w-full pl-9 pr-4 py-1.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              {/* Instant Search Dropdown */}
              {searchDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-slate-900/95 border border-white/10 shadow-2xl overflow-hidden z-50 p-2 space-y-1">
                  <div className="text-[10px] font-semibold uppercase text-slate-400 px-2 py-1 flex justify-between">
                    <span>Matching Products</span>
                    {searchLoading && <span>Searching...</span>}
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="text-xs text-slate-500 px-2 py-3 text-center">
                      No SKU matching &ldquo;{globalSearch}&rdquo;
                    </div>
                  ) : (
                    searchResults.map((item) => (
                      <Link
                        key={item.id}
                        href="/products"
                        onClick={() => {
                          setSearchDropdownOpen(false);
                          setGlobalSearch("");
                        }}
                        className="p-2 rounded-lg hover:bg-white/5 flex items-center justify-between text-xs transition-colors group"
                      >
                        <div>
                          <div className="font-semibold text-white group-hover:text-indigo-300">
                            {item.name}
                          </div>
                          <span className="font-mono text-[10px] text-indigo-400">
                            {item.sku} &bull; {item.categoryName}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-400">
                            {item.totalStock} {item.uom}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Header: Status Pill & Role Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Ledger Active</span>
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
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
              <span className="hidden sm:inline">{user.roleLabel}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* ============================================================== */}
      {/* MY PROFILE MODAL */}
      {/* ============================================================== */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Staff Profile</h3>
                  <p className="text-xs text-slate-400">StockSense Identity &amp; RBAC Access</p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="font-semibold text-white">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Work Email:</span>
                  <span className="font-semibold text-white">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Operational Role:</span>
                  <span className="font-semibold text-indigo-300">{user.roleLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Facility:</span>
                  <span className="font-semibold text-emerald-400">
                    {user.warehouseLocation || "Central Distribution Center (HQ)"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5">
                <span className="text-slate-400 font-medium block mb-1.5">RBAC Permissions:</span>
                <div className="flex flex-wrap gap-1">
                  {user.permissions && user.permissions.length > 0 ? (
                    user.permissions.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono text-[10px] border border-indigo-500/20"
                      >
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-[11px]">Full inventory permissions granted</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
