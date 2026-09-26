"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Shield,
  Warehouse,
  LogOut,
  TrendingUp,
  Package,
  AlertTriangle,
  FileCheck2,
  Truck,
  Barcode,
  History,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  Building,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import Navigation from "@/components/Navigation";

interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  department?: string | null;
  warehouseLocation?: string | null;
  permissions: string[];
}

interface RegisterEntry {
  id: string;
  sku: string;
  name: string;
  action: "INTAKE" | "DISPATCH" | "CYCLE_COUNT" | "ADJUSTMENT";
  quantity: number;
  location: string;
  operator: string;
  timestamp: string;
  status: "VERIFIED" | "IN_PROGRESS" | "FLAGGED";
}

const INITIAL_REGISTER: RegisterEntry[] = [
  {
    id: "REG-1049",
    sku: "SKU-9921",
    name: "Industrial Servo Motor 48V",
    action: "INTAKE",
    quantity: +150,
    location: "Hub East - Bay 12",
    operator: "Marcus Rodriguez",
    timestamp: "2 mins ago",
    status: "VERIFIED",
  },
  {
    id: "REG-1048",
    sku: "SKU-4402",
    name: "High-Temp Ceramic Bearings",
    action: "DISPATCH",
    quantity: -35,
    location: "Central Distribution Center",
    operator: "Elena Vance",
    timestamp: "14 mins ago",
    status: "VERIFIED",
  },
  {
    id: "REG-1047",
    sku: "SKU-1088",
    name: "Managed Ethernet Switch 24P",
    action: "CYCLE_COUNT",
    quantity: 84,
    location: "Hub North - Shelf 04",
    operator: "Floor Scanner #03",
    timestamp: "45 mins ago",
    status: "VERIFIED",
  },
  {
    id: "REG-1046",
    sku: "SKU-7731",
    name: "Pneumatic Solenoid Valve",
    action: "ADJUSTMENT",
    quantity: -3,
    location: "Central Distribution Center",
    operator: "Elena Vance",
    timestamp: "1 hour ago",
    status: "FLAGGED",
  },
];

export default function DashboardClient({
  initialUser,
}: {
  initialUser: DashboardUser;
}) {
  const router = useRouter();
  const [user] = useState<DashboardUser>(initialUser);
  const [entries, setEntries] = useState<RegisterEntry[]>(INITIAL_REGISTER);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // New quick register item form state
  const [newSku, setNewSku] = useState("SKU-5501");
  const [newItemName, setNewItemName] = useState("Solid State Relay 25A");
  const [newAction, setNewAction] = useState<"INTAKE" | "DISPATCH" | "CYCLE_COUNT" | "ADJUSTMENT">("INTAKE");
  const [newQty, setNewQty] = useState(25);
  const [newLocation, setNewLocation] = useState(user.warehouseLocation || "Main Floor - Bay 01");

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

  const handleAddRegisterEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: RegisterEntry = {
      id: `REG-${Math.floor(1050 + Math.random() * 900)}`,
      sku: newSku,
      name: newItemName,
      action: newAction,
      quantity: newAction === "DISPATCH" ? -Math.abs(newQty) : Math.abs(newQty),
      location: newLocation,
      operator: user.name,
      timestamp: "Just now",
      status: "VERIFIED",
    };

    setEntries([newEntry, ...entries]);
    setShowAddModal(false);
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction =
      filterAction === "ALL" || entry.action === filterAction;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col">
      {/* Shared Navigation Bar */}
      <Navigation user={user} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner: Replacing Manual Registers */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/50 via-slate-900/60 to-slate-900 border border-indigo-500/20 p-5 sm:p-6 shadow-xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <FileCheck2 className="w-4 h-4" />
                <span>Centralized Digital Ledger Protocol</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Welcome back, {user.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                StockSense replaces paper registers with real-time, audit-grade digital telemetry.
                {isManager
                  ? " You have administrative authority over multi-facility valuation, audit trails, and inventory thresholds."
                  : " You have floor-level authority for immediate intake receipts, dispatch logging, and cycle audits."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                id="quick-entry-btn"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Log Digital Movement</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic KPI Cards Based on Active Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isManager ? (
            <>
              {/* Card 1: Valuation */}
              <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-indigo-500/30 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Inventory Valuation</span>
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white font-mono">$2,482,900</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-medium">
                  <span>+4.2%</span>
                  <span className="text-slate-500">vs last month balance</span>
                </div>
              </div>

              {/* Card 2: Monitored SKUs */}
              <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-indigo-500/30 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Active Catalog SKUs</span>
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white font-mono">14,820</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                  <span>4 Regional Warehouses</span>
                </div>
              </div>

              {/* Card 3: Low Stock Alerts */}
              <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-amber-500/30 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Low Stock Alerts</span>
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-300 font-mono">18 Items</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400/80">
                  <span>Automatic PO draft triggered</span>
                </div>
              </div>

              {/* Card 4: Audit & Staff */}
              <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Staff Verification</span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white font-mono">100%</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Audit trail synced</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Warehouse Staff Card 1: Inbound Shipments */}
              <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Scheduled Intake</span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white font-mono">6 Inbound Docks</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
                  <span>2 arriving within the hour</span>
                </div>
              </div>

              {/* Warehouse Staff Card 2: Dispatch Queue */}
              <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Dispatch Queue</span>
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white font-mono">142 Outbound Orders</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                  <span>Priority carrier pickup at 14:00</span>
                </div>
              </div>

              {/* Warehouse Staff Card 3: Scanned Today */}
              <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Barcode Scans Today</span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Barcode className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-300 font-mono">1,284 Units</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
                  <span>+18% above shift target</span>
                </div>
              </div>

              {/* Warehouse Staff Card 4: Discrepancies */}
              <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Variance &amp; Damaged</span>
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white font-mono">0 Discrepancies</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Cycle count matched perfectly</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Real-Time Digital Register (Replacing Manual Logbooks) */}
        <div className="glass-panel rounded-2xl border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">
                  Real-Time Centralized Stock Register
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Every movement is digitally audited with operator attribution and warehouse localization.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {["ALL", "INTAKE", "DISPATCH", "CYCLE_COUNT", "ADJUSTMENT"].map((action) => (
                <button
                  key={action}
                  onClick={() => setFilterAction(action)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    filterAction === action
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-900/60 text-slate-400 hover:text-white border border-white/5"
                  }`}
                >
                  {action.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU, item name, operator, or bay location..."
              className="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Register ID</th>
                  <th className="py-3 px-4">SKU / Item</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Warehouse Zone</th>
                  <th className="py-3 px-4">Logged By</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-indigo-400">
                      {entry.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{entry.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{entry.sku}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                          entry.action === "INTAKE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : entry.action === "DISPATCH"
                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                            : entry.action === "CYCLE_COUNT"
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      <span
                        className={
                          entry.quantity > 0
                            ? "text-emerald-400"
                            : entry.quantity < 0
                            ? "text-rose-400"
                            : "text-slate-300"
                        }
                      >
                        {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity} Units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 flex items-center gap-1.5 mt-2">
                      <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{entry.location}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="font-medium text-white">{entry.operator}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{entry.timestamp}</td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          entry.status === "VERIFIED"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : entry.status === "IN_PROGRESS"
                            ? "bg-indigo-500/10 text-indigo-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security & Role Permissions Diagnostic Card */}
        <div className="glass-panel rounded-2xl border border-white/10 p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                Active Session &amp; RBAC Access Matrix
              </h3>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              User ID: <span className="text-indigo-300">{user.id}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Authentication Mode:</span>
                <span className="font-semibold text-emerald-400">JWT + HTTP-Only Cookie Session</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Department:</span>
                <span className="font-semibold text-white">{user.department || "General Logistics"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Facility / Zone:</span>
                <span className="font-semibold text-white">{user.warehouseLocation || "Global Distribution"}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
              <p className="text-slate-400 mb-2 font-medium">Active Permissions Granted:</p>
              <div className="flex flex-wrap gap-1.5">
                {user.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono text-[10px]"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Quick Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Barcode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Log Digital Movement</h3>
                  <p className="text-xs text-slate-400">Directly updates the centralized StockSense register</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRegisterEntry} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Movement Type</label>
                  <select
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value as any)}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white bg-slate-900"
                  >
                    <option value="INTAKE">Intake (Receipt)</option>
                    <option value="DISPATCH">Dispatch (Outbound)</option>
                    <option value="CYCLE_COUNT">Cycle Count</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Item Description</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Quantity (Units)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Warehouse Location</label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="confirm-digital-entry-btn"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Confirm &amp; Record Digital Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
