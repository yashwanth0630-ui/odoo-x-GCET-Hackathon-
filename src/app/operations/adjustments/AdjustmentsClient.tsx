"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import {
  SlidersHorizontal,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building,
  Package,
  History,
  Scale,
  ArrowRight,
  Loader2,
  Check,
  X,
  FileCheck2,
} from "lucide-react";

interface AdjustmentsClientProps {
  user: any;
}

export default function AdjustmentsClient({ user }: AdjustmentsClientProps) {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [countedQty, setCountedQty] = useState<number | "">(0);
  const [reason, setReason] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [adjRes, prodRes, locRes] = await Promise.all([
        fetch("/api/adjustments"),
        fetch("/api/products"),
        fetch("/api/locations"),
      ]);

      const adjData = await adjRes.json();
      const prodData = await prodRes.json();
      const locData = await locRes.json();

      if (adjData.success) setAdjustments(adjData.adjustments);
      if (prodData.success) {
        setProducts(prodData.products);
        if (prodData.products.length > 0 && !selectedProductId) {
          setSelectedProductId(prodData.products[0].id);
        }
      }
      if (locData.success) {
        setWarehouses(locData.warehouses);
        if (locData.warehouses.length > 0 && locData.warehouses[0].locations.length > 0 && !selectedLocationId) {
          setSelectedLocationId(locData.warehouses[0].locations[0].id);
        }
      }
    } catch {
      showToast("error", "Failed to load adjustment logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const allSubLocations: any[] = [];
  warehouses.forEach((wh) => {
    wh.locations.forEach((loc: any) => {
      allSubLocations.push({
        id: loc.id,
        label: `${wh.name} → ${loc.name} (${loc.code})`,
      });
    });
  });

  // Calculate current recorded quantity for selected product & location
  const currentProduct = products.find((p) => p.id === selectedProductId);
  const currentLocationStock = currentProduct?.stockLevels?.find(
    (sl: any) => sl.locationId === selectedLocationId
  );
  const recordedQuantity = currentLocationStock ? currentLocationStock.quantity : 0;

  const numericCounted = countedQty === "" ? 0 : Number(countedQty);
  const calculatedDifference = numericCounted - recordedQuantity;

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countedQty === "") return;
    setActionLoading(true);

    try {
      const res = await fetch("/api/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          locationId: selectedLocationId,
          countedQuantity: numericCounted,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.message || "Failed to post adjustment.");
        setActionLoading(false);
        return;
      }

      showToast("success", data.message);
      setShowModal(false);
      setReason("");
      loadData();
    } catch {
      showToast("error", "Error applying stock adjustment");
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
            <div className="flex items-center gap-2 text-[#AD543C] text-xs font-semibold uppercase tracking-wider mb-1">
              <Scale className="w-4 h-4" />
              <span>Physical Count Reconciliation</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Inventory Adjustments &amp; Cycle Counts
            </h1>
            <p className="text-xs text-[#988879] mt-1">
              Fix mismatches between recorded ledger figures and physical counts (e.g. damaged stock or cycle audit).
            </p>
          </div>

          <button
            onClick={() => {
              setCountedQty(recordedQuantity);
              setShowModal(true);
            }}
            id="new-adjustment-btn"
            className="px-4 py-2.5 rounded-xl bg-[#AD543C] hover:bg-[#c06244] text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#AD543C]/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Perform Stock Adjustment</span>
          </button>
        </div>

        {/* Adjustments Review Table */}
        <div className="glass-panel rounded-2xl border border-[#C3B4AA]/12 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-[#C3B4AA]/12 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-[#AD543C]" />
              <span>Discrepancy Audit History</span>
            </h2>
            <span className="text-xs text-[#6E655C] font-mono">
              Total Recorded Adjustments: {adjustments.length}
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#2e2823]/80 border-b border-[#C3B4AA]/12 text-[#988879] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Adjustment Ref</th>
                <th className="py-3 px-4">Item SKU / Name</th>
                <th className="py-3 px-4">Audited Location</th>
                <th className="py-3 px-4">Adjustment Difference</th>
                <th className="py-3 px-4">Justification &amp; Notes</th>
                <th className="py-3 px-4">Audited By</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#988879]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-[#AD543C]" />
                    <span>Loading adjustment history...</span>
                  </td>
                </tr>
              ) : adjustments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#988879]">
                    No physical count adjustments recorded yet.
                  </td>
                </tr>
              ) : (
                adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#AD543C]">
                      {adj.reference}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{adj.product?.name}</div>
                      <span className="font-mono text-[10px] text-[#6E655C]">{adj.product?.sku}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#C3B4AA]">
                      <span className="text-white font-medium">{adj.sourceLocation?.name}</span>
                      <span className="text-[10px] text-[#6E655C] block font-mono">
                        {adj.sourceLocation?.warehouse?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sm">
                      <span
                        className={
                          adj.quantity > 0
                            ? "text-emerald-400"
                            : adj.quantity < 0
                            ? "text-rose-400"
                            : "text-[#988879]"
                        }
                      >
                        {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity} {adj.product?.uom}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#C3B4AA] max-w-[200px] truncate">
                      {adj.reason || "Physical count mismatch"}
                    </td>
                    <td className="py-3.5 px-4 text-[#988879]">
                      {adj.operator?.name || "System Staff"}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#988879] font-mono text-[11px]">
                      {new Date(adj.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUSTMENT MODAL WITH AUTO-CALCULATION */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-[#C3B4AA]/12 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#C3B4AA]/12">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#AD543C]/10 text-[#AD543C]">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Physical Stock Adjustment</h3>
                  <p className="text-xs text-[#988879]">Reconcile physical on-hand units with Stock Ledger</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#988879] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#C3B4AA] font-semibold mb-1">Select Catalog Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-xl text-white bg-slate-900"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) &bull; Total: {p.totalStock} {p.uom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#C3B4AA] font-semibold mb-1">Audited Sub-Location</label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-xl text-white bg-slate-900"
                >
                  {allSubLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Real-Time Auto-Calculation Panel (Required by prompt) */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-[#AD543C]/30 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-800/60 border border-[#C3B4AA]/8">
                    <span className="text-[10px] text-[#988879] uppercase tracking-wider block">Recorded Stock</span>
                    <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                      {recordedQuantity}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#AD543C]/10 border border-[#AD543C]/40">
                    <span className="text-[10px] text-[#e0a08a] uppercase tracking-wider block">Counted Qty</span>
                    <input
                      type="number"
                      min={0}
                      required
                      value={countedQty}
                      onChange={(e) => setCountedQty(e.target.value === "" ? "" : Number(e.target.value))}
                      className="glass-input w-full px-1 py-0.5 text-center text-lg font-bold font-mono text-white mt-0.5 rounded"
                    />
                  </div>

                  <div
                    className={`p-2 rounded-lg border ${
                      calculatedDifference === 0
                        ? "bg-slate-800/60 border-[#C3B4AA]/8 text-[#C3B4AA]"
                        : calculatedDifference > 0
                        ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                        : "bg-rose-950/60 border-rose-500/40 text-rose-300"
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider block">Auto Difference</span>
                    <span className="text-lg font-bold font-mono mt-0.5 block">
                      {calculatedDifference > 0 ? `+${calculatedDifference}` : calculatedDifference}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[#988879] text-center font-medium">
                  {calculatedDifference < 0 ? (
                    <span className="text-rose-400">
                      ⚠️ Shrinkage / Defect detected: Stock will decrease by {Math.abs(calculatedDifference)} units.
                    </span>
                  ) : calculatedDifference > 0 ? (
                    <span className="text-emerald-400">
                      ✓ Surplus detected: Stock will increase by {calculatedDifference} units.
                    </span>
                  ) : (
                    <span>Physical count matches digital records exactly.</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[#C3B4AA] font-semibold mb-1">
                  Reason for Adjustment <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. 3 units damaged due to water leak / cycle recount"
                  className="glass-input w-full px-3 py-2 rounded-xl text-white placeholder-[#6E655C]"
                />
              </div>

              <div className="pt-3 border-t border-[#C3B4AA]/12 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#584D44] text-[#C3B4AA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#AD543C] hover:bg-[#c06244] text-white font-semibold shadow-lg shadow-[#AD543C]/30"
                >
                  Apply &amp; Log Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
