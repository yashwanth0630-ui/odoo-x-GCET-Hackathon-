"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Box,
  Check,
  X,
  Loader2,
  AlertCircle,
  PackageCheck,
  Send,
} from "lucide-react";

interface DeliveriesClientProps {
  user: any;
}

export default function DeliveriesClient({ user }: DeliveriesClientProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [sourceLocationId, setSourceLocationId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [notes, setNotes] = useState("");

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsRes, prodRes, locRes] = await Promise.all([
        fetch("/api/operations?type=DELIVERY"),
        fetch("/api/products"),
        fetch("/api/locations"),
      ]);

      const docsData = await docsRes.json();
      const prodData = await prodRes.json();
      const locData = await locRes.json();

      if (docsData.success) setDocuments(docsData.documents);
      if (prodData.success) {
        setProducts(prodData.products);
        if (prodData.products.length > 0 && !selectedProductId) {
          setSelectedProductId(prodData.products[0].id);
        }
      }
      if (locData.success) {
        setWarehouses(locData.warehouses);
        if (locData.warehouses.length > 0 && locData.warehouses[0].locations.length > 0 && !sourceLocationId) {
          setSourceLocationId(locData.warehouses[0].locations[0].id);
        }
      }
    } catch {
      showToast("error", "Failed to load deliveries");
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

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "DELIVERY",
          partnerName: customerName,
          sourceLocationId,
          notes,
          items: [{ productId: selectedProductId, quantity: Number(quantity) }],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.message || "Failed to create delivery order.");
        setActionLoading(false);
        return;
      }

      showToast("success", data.message);
      setShowCreateModal(false);
      setCustomerName("");
      setNotes("");
      loadData();
    } catch {
      showToast("error", "Error creating delivery order");
    } finally {
      setActionLoading(false);
    }
  };

  // Step 1: Pick
  const handlePick = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/operations/${id}/pick`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.message || "Failed to pick items.");
        return;
      }
      showToast("success", "Items marked as Picked from warehouse shelves.");
      loadData();
    } catch {
      showToast("error", "Error processing pick step");
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: Pack
  const handlePack = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/operations/${id}/pack`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.message || "Failed to pack items.");
        return;
      }
      showToast("success", "Items marked as Packed into parcels.");
      loadData();
    } catch {
      showToast("error", "Error processing pack step");
    } finally {
      setActionLoading(false);
    }
  };

  // Step 3: Validate & Ship
  const handleValidate = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/operations/${id}/validate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.message || "Validation failed.");
        return;
      }
      showToast("success", data.message);
      loadData();
    } catch {
      showToast("error", "Error validating shipment");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      doc.referenceNumber.toLowerCase().includes(q) ||
      (doc.partnerName && doc.partnerName.toLowerCase().includes(q));

    const matchesStatus = statusFilter === "ALL" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
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
              <Truck className="w-4 h-4" />
              <span>Outbound Shipping &amp; Fulfillment</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Delivery Orders (Outgoing Goods)
            </h1>
            <p className="text-xs text-[#988879] mt-1">
              Manage fulfillment steps: Pick items &rarr; Pack items &rarr; Validate to deduct stock and record in the Stock Ledger.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            id="create-delivery-btn"
            className="px-4 py-2.5 rounded-xl bg-[#AD543C] hover:bg-[#c06244] text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#AD543C]/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Delivery Order</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="glass-panel p-3.5 rounded-2xl border border-[#C3B4AA]/12 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#988879] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference (WH/OUT/...) or customer..."
              className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs text-white placeholder-[#6E655C]"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {["ALL", "WAITING", "READY", "DONE"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  statusFilter === st
                    ? "bg-[#AD543C] text-white"
                    : "bg-[#2e2823]/60 text-[#988879] hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Deliveries Table */}
        <div className="glass-panel rounded-2xl border border-[#C3B4AA]/12 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#2e2823]/80 border-b border-[#C3B4AA]/12 text-[#988879] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Customer / Partner</th>
                <th className="py-3 px-4">Source Location</th>
                <th className="py-3 px-4">Products &amp; Qty</th>
                <th className="py-3 px-4">Fulfillment Status</th>
                <th className="py-3 px-4 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#988879]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-[#AD543C]" />
                    <span>Loading deliveries...</span>
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#988879]">
                    No delivery orders found.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const allPicked = doc.items.every((it: any) => it.picked);
                  const allPacked = doc.items.every((it: any) => it.packed);

                  return (
                    <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#AD543C]">
                        {doc.referenceNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {doc.partnerName || "General Customer"}
                      </td>
                      <td className="py-3.5 px-4 text-[#C3B4AA]">
                        <span className="text-white font-medium">{doc.sourceLocation?.name}</span>
                        <span className="text-[10px] text-[#6E655C] block font-mono">
                          {doc.sourceLocation?.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {doc.items.map((it: any) => (
                          <div key={it.id} className="text-[#C3B4AA]">
                            <span>{it.product?.name}</span> &bull;{" "}
                            <strong className="text-rose-400 font-mono">-{it.quantity} {it.product?.uom}</strong>
                          </div>
                        ))}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              doc.status === "DONE"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : doc.status === "READY"
                                ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                            }`}
                          >
                            {doc.status}
                          </span>
                          <div className="text-[10px] text-[#988879] flex items-center gap-2">
                            <span className={allPicked ? "text-emerald-400 font-semibold" : "text-[#6E655C]"}>
                              {allPicked ? "✓ Picked" : "○ Not Picked"}
                            </span>
                            <span>&bull;</span>
                            <span className={allPacked ? "text-emerald-400 font-semibold" : "text-[#6E655C]"}>
                              {allPacked ? "✓ Packed" : "○ Not Packed"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3 Steps: Pick -> Pack -> Validate */}
                      <td className="py-3.5 px-4 text-right">
                        {doc.status === "DONE" ? (
                          <span className="text-[11px] text-[#6E655C] flex items-center justify-end gap-1 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Shipped &bull; Stock - Deducted</span>
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Step 1: Pick Items */}
                            {!allPicked && (
                              <button
                                onClick={() => handlePick(doc.id)}
                                disabled={actionLoading}
                                id={`pick-btn-${doc.referenceNumber}`}
                                className="px-2.5 py-1.5 rounded-lg bg-[#584D44] hover:bg-[#6E655C] text-[#e0a08a] hover:text-white font-medium text-xs border border-[#C3B4AA]/12 flex items-center gap-1 transition-colors"
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                <span>Pick Items</span>
                              </button>
                            )}

                            {/* Step 2: Pack Items */}
                            {allPicked && !allPacked && (
                              <button
                                onClick={() => handlePack(doc.id)}
                                disabled={actionLoading}
                                id={`pack-btn-${doc.referenceNumber}`}
                                className="px-2.5 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-300 font-medium text-xs border border-sky-500/30 flex items-center gap-1 transition-colors"
                              >
                                <Box className="w-3.5 h-3.5" />
                                <span>Pack Items</span>
                              </button>
                            )}

                            {/* Step 3: Validate & Dispatch */}
                            {allPicked && allPacked && (
                              <button
                                onClick={() => handleValidate(doc.id)}
                                disabled={actionLoading}
                                id={`validate-delivery-${doc.referenceNumber}`}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Validate &amp; Ship (-Stock)</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-[#C3B4AA]/12 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#C3B4AA]/12">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#AD543C]/10 text-[#AD543C]">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Delivery Order</h3>
                  <p className="text-xs text-[#988879]">Outbound customer shipment with Pick &amp; Pack tracking</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-[#988879] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#C3B4AA] font-semibold mb-1">
                  Customer / Recipient <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Apex Robotics Systems Inc."
                  className="glass-input w-full px-3 py-2 rounded-xl text-white placeholder-[#6E655C]"
                />
              </div>

              <div>
                <label className="block text-[#C3B4AA] font-semibold mb-1">
                  Source Sub-Location <span className="text-rose-400">*</span>
                </label>
                <select
                  value={sourceLocationId}
                  onChange={(e) => setSourceLocationId(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-xl text-white bg-slate-900"
                >
                  {allSubLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#C3B4AA] font-semibold mb-1">Product</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-xl text-white bg-slate-900"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) &bull; Avail: {p.totalStock} {p.uom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#C3B4AA] font-semibold mb-1">Quantity to Ship</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="glass-input w-full px-3 py-2 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#C3B4AA] font-semibold mb-1">Notes / Sales Order Ref</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. SO-2026-4402 Priority Freight"
                  className="glass-input w-full px-3 py-2 rounded-xl text-white placeholder-[#6E655C]"
                />
              </div>

              <div className="pt-3 border-t border-[#C3B4AA]/12 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#584D44] text-[#C3B4AA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#AD543C] hover:bg-[#c06244] text-white font-semibold shadow-lg shadow-[#AD543C]/30"
                >
                  Create Delivery Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
