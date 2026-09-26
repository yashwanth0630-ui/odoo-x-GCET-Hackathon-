"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import {
  Building2,
  Plus,
  Warehouse,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Layers,
  ArrowRight,
} from "lucide-react";

interface WarehouseSettingsClientProps {
  user: any;
}

export default function WarehouseSettingsClient({ user }: WarehouseSettingsClientProps) {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [showWhModal, setShowWhModal] = useState(false);
  const [showLocModal, setShowLocModal] = useState(false);
  const [targetWhId, setTargetWhId] = useState("");

  // Warehouse Form
  const [whName, setWhName] = useState("");
  const [whCode, setWhCode] = useState("");
  const [whAddress, setWhAddress] = useState("");

  // Location Form
  const [locName, setLocName] = useState("");
  const [locCode, setLocCode] = useState("");
  const [locType, setLocType] = useState("STORAGE");

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/warehouses");
      const data = await res.json();
      if (data.success) {
        setWarehouses(data.warehouses);
        if (data.warehouses.length > 0 && !targetWhId) {
          setTargetWhId(data.warehouses[0].id);
        }
      }
    } catch {
      showToast("error", "Failed to load warehouses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_WAREHOUSE",
          warehouseName: whName,
          warehouseCode: whCode,
          address: whAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.message || "Failed to create warehouse.");
        setActionLoading(false);
        return;
      }

      showToast("success", data.message);
      setShowWhModal(false);
      setWhName("");
      setWhCode("");
      setWhAddress("");
      loadData();
    } catch {
      showToast("error", "Network error creating warehouse");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_LOCATION",
          warehouseId: targetWhId,
          locationName: locName,
          locationCode: locCode,
          locationType: locType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.message || "Failed to create sub-location.");
        setActionLoading(false);
        return;
      }

      showToast("success", data.message);
      setShowLocModal(false);
      setLocName("");
      setLocCode("");
      loadData();
    } catch {
      showToast("error", "Network error creating sub-location");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppLayout user={user}>
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-fadeIn">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold backdrop-blur-md ${
              notification.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
                : "bg-rose-950/90 border-rose-500/40 text-rose-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>Physical Infrastructure</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Warehouse &amp; Location Configuration
            </h1>
            <p className="text-xs text-[#988879] mt-1">
              Manage facility hierarchies: Regional Warehouses &rarr; Sub-Locations (Racks, Bins, Docks, Bays).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWhModal(true)}
              id="add-warehouse-btn"
              className="px-4 py-2.5 rounded-xl bg-[#AD543C] hover:bg-[#c06244] text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#AD543C]/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Facility (Warehouse)</span>
            </button>
            <button
              onClick={() => setShowLocModal(true)}
              id="add-sublocation-btn"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Sub-Location</span>
            </button>
          </div>
        </div>

        {/* Warehouses List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 py-12 text-center text-[#988879]">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#AD543C]" />
              <span>Loading warehouse configurations...</span>
            </div>
          ) : (
            warehouses.map((wh) => (
              <div
                key={wh.id}
                className="glass-panel rounded-2xl border border-[#C3B4AA]/12 p-5 space-y-4 hover:border-[#AD543C]/30 transition-all"
              >
                {/* Warehouse Card Header */}
                <div className="flex items-start justify-between pb-3 border-b border-[#C3B4AA]/8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-[#AD543C]/10 text-[#AD543C] border border-[#AD543C]/20">
                      <Warehouse className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white">{wh.name}</h2>
                        <span className="font-mono text-xs font-bold text-[#AD543C] px-2 py-0.5 rounded bg-[#AD543C]/10 border border-[#AD543C]/20">
                          {wh.code}
                        </span>
                      </div>
                      {wh.address && (
                        <p className="text-xs text-[#988879] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#6E655C] shrink-0" />
                          <span>{wh.address}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-[#988879] bg-[#2e2823] px-2 py-1 rounded border border-[#C3B4AA]/8">
                    {wh.locations.length} Sub-Locations
                  </span>
                </div>

                {/* Sub-Locations Grid */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#988879] mb-2">
                    Configured Racks, Bays &amp; Docks:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {wh.locations.map((loc: any) => (
                      <div
                        key={loc.id}
                        className="p-2.5 rounded-xl bg-[#2e2823]/70 border border-[#C3B4AA]/8 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-white">{loc.name}</p>
                          <span className="font-mono text-[10px] text-[#988879]">{loc.code}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#584D44] text-[#e0a08a]">
                          {loc.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE WAREHOUSE MODAL */}
      {showWhModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-[#C3B4AA]/12 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#C3B4AA]/12">
              <h3 className="text-base font-bold text-white">Add Warehouse Facility</h3>
              <button onClick={() => setShowWhModal(false)} className="text-[#988879] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#C3B4AA] font-semibold mb-1">Warehouse Name</label>
                <input
                  type="text"
                  required
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  placeholder="e.g. West Coast Fulfillment Center"
                  className="glass-input w-full px-3 py-2 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-[#C3B4AA] font-semibold mb-1">Facility Code</label>
                <input
                  type="text"
                  required
                  value={whCode}
                  onChange={(e) => setWhCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WCF-03"
                  className="glass-input w-full px-3 py-2 rounded-xl text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[#C3B4AA] font-semibold mb-1">Physical Address</label>
                <input
                  type="text"
                  value={whAddress}
                  onChange={(e) => setWhAddress(e.target.value)}
                  placeholder="e.g. 500 Pacific Way, Reno, NV 89502"
                  className="glass-input w-full px-3 py-2 rounded-xl text-white"
                />
              </div>

              <div className="pt-3 border-t border-[#C3B4AA]/12 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWhModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#584D44] text-[#C3B4AA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#AD543C] hover:bg-[#c06244] text-white font-semibold"
                >
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SUB-LOCATION MODAL */}
      {showLocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-[#C3B4AA]/12 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#C3B4AA]/12">
              <h3 className="text-base font-bold text-white">Add Sub-Location</h3>
              <button onClick={() => setShowLocModal(false)} className="text-[#988879] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLocation} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#C3B4AA] font-semibold mb-1">Parent Warehouse</label>
                <select
                  value={targetWhId}
                  onChange={(e) => setTargetWhId(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-xl text-white bg-slate-900"
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#C3B4AA] font-semibold mb-1">Sub-Location Name</label>
                <input
                  type="text"
                  required
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="e.g. Rack C - Fasteners"
                  className="glass-input w-full px-3 py-2 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#C3B4AA] font-semibold mb-1">Location Code</label>
                  <input
                    type="text"
                    required
                    value={locCode}
                    onChange={(e) => setLocCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CDC-RACK-C"
                    className="glass-input w-full px-3 py-2 rounded-xl text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[#C3B4AA] font-semibold mb-1">Type</label>
                  <select
                    value={locType}
                    onChange={(e) => setLocType(e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-xl text-white bg-slate-900"
                  >
                    <option value="STORAGE">Storage</option>
                    <option value="RECEIVING">Receiving</option>
                    <option value="DISPATCH">Dispatch</option>
                    <option value="QUARANTINE">Quarantine</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#C3B4AA]/12 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLocModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#584D44] text-[#C3B4AA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Save Sub-Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
