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
    <div className="min-h-screen bg-[#1a1614] text-[#e8ddd4] flex flex-col md:flex-row relative">
      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ============================================================== */}
      {/* PERSISTENT LEFT SIDEBAR */}
      {/* ============================================================== */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#241f1b] border-r border-[#C3B4AA]/12 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top: Brand Header */}
        <div className="p-4 border-b border-[#C3B4AA]/12 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#AD543C] to-[#d4886e] flex items-center justify-center shadow-lg shadow-[#AD543C]/25 group-hover:scale-105 transition-transform">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white font-mono flex items-center gap-1.5">
                Stock<span className="text-[#AD543C]">Sense</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-semibold bg-[#AD543C]/20 text-[#e0a08a] border border-[#AD543C]/30">
                  IMS
                </span>
              </span>
              <p className="text-[10px] text-[#988879]">Modular Inventory Telemetry</p>
            </div>
          </Link>

          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden text-[#988879] hover:text-white"
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
                ? "bg-[#AD543C] text-white shadow-md shadow-[#AD543C]/30"
                : "text-[#988879] hover:text-white hover:bg-[#C3B4AA]/5"
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
                ? "bg-[#AD543C] text-white shadow-md shadow-[#AD543C]/30"
                : "text-[#988879] hover:text-white hover:bg-[#C3B4AA]/5"
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>Products</span>
          </Link>

          {/* 3. Operations (Dropdown / Sub-menu) */}
          <div className="pt-2">
            <button
              onClick={() => setOperationsOpen(!operationsOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-[#988879] hover:text-white hover:bg-[#C3B4AA]/5 transition-all text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#AD543C]" />
                <span className="font-semibold text-[#C3B4AA]">Operations</span>
              </div>
              {operationsOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#988879]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#988879]" />
              )}
            </button>

            {operationsOpen && (
              <div className="mt-1 ml-4 pl-3 border-l border-[#C3B4AA]/10 space-y-1">
                {/* Receipts */}
                <Link
                  href="/operations/receipts"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                    pathname === "/operations/receipts"
                      ? "text-[#d4886e] font-semibold bg-[#AD543C]/10"
                      : "text-[#988879] hover:text-white hover:bg-[#C3B4AA]/5"
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
                      ? "text-[#d4886e] font-semibold bg-[#AD543C]/10"
                      : "text-[#988879] hover:text-white hover:bg-[#C3B4AA]/5"
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Delivery Orders</span>
                </Link>

                {/* Internal Transfers */}
                <Link
                  href="/operations/internal-transfers"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                    pathname === "/operations/internal-transfers"
                      ? "text-[#d4886e] font-semibold bg-[#AD543C]/10"
                      : "text-[#988879] hover:text-white hover:bg-[#C3B4AA]/5"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Internal Transfers</span>
                </Link>

                {/* Inventory Adjustment */}
                <Link
                  href="/operations/adjustments"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                    pathname === "/operations/adjustments"
                      ? "text-[#d4886e] font-semibold bg-[#AD543C]/10"
                      : "text-[#988879] hover:text-white hover:bg-[#C3B4AA]/5"
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
                      ? "text-[#d4886e] font-semibold bg-[#AD543C]/10"
                      : "text-[#988879] hover:text-white hover:bg-[#C3B4AA]/5"
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
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-[#988879] hover:text-white hover:bg-[#C3B4AA]/5 transition-all text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-[#C3B4AA]" />
                <span className="font-semibold text-[#C3B4AA]">Settings</span>
              </div>
              {settingsOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#988879]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#988879]" />
              )}
            </button>

            {settingsOpen && (
              <div className="mt-1 ml-4 pl-3 border-l border-[#C3B4AA]/10 space-y-1">
                <Link
                  href="/settings/warehouses"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                    pathname === "/settings/warehouses"
                      ? "text-[#C3B4AA] font-semibold bg-[#C3B4AA]/10"
                      : "text-[#988879] hover:text-white hover:bg-[#C3B4AA]/5"
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
        <div className="p-3 border-t border-[#C3B4AA]/12 bg-[#1a1614]/40 space-y-2">
          {/* User Card */}
          <div className="p-2.5 rounded-xl bg-[#2e2823]/60 border border-[#C3B4AA]/8 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#AD543C]/30 text-[#e0a08a] font-bold flex items-center justify-center border border-[#AD543C]/20 uppercase shrink-0 text-xs">
                {user.name.slice(0, 2)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 border ${
                    isManager
                      ? "bg-[#AD543C]/15 text-[#e0a08a] border-[#AD543C]/30"
                      : "bg-[#6E655C]/20 text-[#C3B4AA] border-[#6E655C]/30"
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
              className="py-1.5 px-2 rounded-lg bg-[#584D44] hover:bg-[#6E655C] text-[#C3B4AA] hover:text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
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
        <header className="sticky top-0 z-30 h-16 border-b border-[#C3B4AA]/12 bg-[#241f1b]/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-[#2e2823] text-[#988879] hover:text-white border border-[#C3B4AA]/10"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global SKU Search Bar */}
            <div ref={searchRef} className="relative w-64 sm:w-80 md:w-96">
              <Search className="w-4 h-4 text-[#6E655C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="global-sku-search"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Global SKU Search (e.g. SKU-9921, Servo)..."
                className="glass-input w-full pl-9 pr-4 py-1.5 rounded-xl text-xs text-white placeholder-[#6E655C] focus:outline-none focus:border-[#AD543C]"
              />

              {/* Instant Search Dropdown */}
              {searchDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-[#2e2823]/95 border border-[#C3B4AA]/10 shadow-2xl overflow-hidden z-50 p-2 space-y-1">
                  <div className="text-[10px] font-semibold uppercase text-[#988879] px-2 py-1 flex justify-between">
                    <span>Matching Products</span>
                    {searchLoading && <span>Searching...</span>}
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="text-xs text-[#6E655C] px-2 py-3 text-center">
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
                        className="p-2 rounded-lg hover:bg-[#C3B4AA]/5 flex items-center justify-between text-xs transition-colors group"
                      >
                        <div>
                          <div className="font-semibold text-white group-hover:text-[#d4886e]">
                            {item.name}
                          </div>
                          <span className="font-mono text-[10px] text-[#AD543C]">
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
                  ? "bg-[#AD543C]/10 text-[#e0a08a] border-[#AD543C]/30"
                  : "bg-[#6E655C]/15 text-[#C3B4AA] border-[#6E655C]/30"
              }`}
            >
              {isManager ? (
                <Shield className="w-3.5 h-3.5 text-[#AD543C]" />
              ) : (
                <Warehouse className="w-3.5 h-3.5 text-[#C3B4AA]" />
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
          <div className="glass-panel w-full max-w-md rounded-2xl border border-[#C3B4AA]/10 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#C3B4AA]/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#AD543C]/10 text-[#AD543C]">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Staff Profile</h3>
                  <p className="text-xs text-[#988879]">StockSense Identity &amp; RBAC Access</p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-[#988879] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#2e2823]/70 border border-[#C3B4AA]/8 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#988879]">Full Name:</span>
                  <span className="font-semibold text-white">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#988879]">Work Email:</span>
                  <span className="font-semibold text-white">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#988879]">Operational Role:</span>
                  <span className="font-semibold text-[#e0a08a]">{user.roleLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#988879]">Assigned Facility:</span>
                  <span className="font-semibold text-[#C3B4AA]">
                    {user.warehouseLocation || "Central Distribution Center (HQ)"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#2e2823]/70 border border-[#C3B4AA]/8">
                <span className="text-[#988879] font-medium block mb-1.5">RBAC Permissions:</span>
                <div className="flex flex-wrap gap-1">
                  {user.permissions && user.permissions.length > 0 ? (
                    user.permissions.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded bg-[#AD543C]/10 text-[#e0a08a] font-mono text-[10px] border border-[#AD543C]/20"
                      >
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#6E655C] text-[11px]">Full inventory permissions granted</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#C3B4AA]/10 flex justify-end">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#584D44] hover:bg-[#6E655C] text-white text-xs font-semibold"
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
