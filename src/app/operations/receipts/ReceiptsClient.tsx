"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import {
  ArrowDownToLine,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Building,
  Package,
  Check,
  X,
  Loader2,
  AlertCircle,
  Truck,
  FileCheck2,
} from "lucide-react";

interface ReceiptsClientProps {
  user: any;
}

export default function ReceiptsClient({ user }: ReceiptsClientProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [destLocationId, setDestLocationId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(50);
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
        fetch("/api/operations?type=RECEIPT"),
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
        if (locData.warehouses.length > 0 && locData.warehouses[0].locations.length > 0 && !destLocationId) {
          setDestLocationId(locData.warehouses[0].locations[0].id);
        }
      }
    } catch {
      showToast("error", "Failed to load receipts");
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

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "RECEIPT",
          partnerName: supplierName,
          destinationLocationId: destLocationId,
          notes,
          items: [{ productId: selectedProductId, quantity: Number(quantity) }],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.message || "Failed to create receipt.");
        setActionLoading(false);
        return;
      }

      showToast("success", data.message);
      setShowCreateModal(false);
      setSupplierName("");
      setNotes("");
      loadData();
    } catch {
      showToast("error", "Error creating receipt");
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/operations/${id}/validate`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast("error", data.message || "Validation failed.");
        setActionLoading(false);
        return;
      }

      showToast("success", data.message);
      loadData();
    } catch {
      showToast("error", "Error validating receipt.");
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
              <ArrowDownToLine className="w-4 h-4" />
              <span>Inbound Goods Receiving</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Receipts (Incoming Goods)
            </h1>
            <p className="text-xs text-[#988879] mt-1">
              Record supplier receipts and validate shipments to automatically increase warehouse stock.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            id="create-receipt-btn"
            className="px-4 py-2.5 rounded-xl bg-[#AD543C] hover:bg-[#c06244] text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#AD543C]/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Receipt</span>
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
              placeholder="Search reference (WH/IN/...) or supplier..."
              className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs text-white placeholder-[#6E655C]"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {["ALL", "READY", "DONE", "WAITING"].map((st) => (
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

        {/* Receipts Table */}
        <div className="glass-panel rounded-2xl border border-[#C3B4AA]/12 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#2e2823]/80 border-b border-[#C3B4AA]/12 text-[#988879] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Supplier / Partner</th>
                <th className="py-3 px-4">Destination Location</th>
                <th className="py-3 px-4">Products &amp; Qty</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#988879]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-[#AD543C]" />
                    <span>Loading receipts...</span>
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#988879]">
                    No receipts found.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#AD543C]">
                      {doc.referenceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white">{doc.partnerName || "General Supplier"}</span>
                    </td>
                    <td className="py-3 px-4 text-[#C3B4AA]">
                      <span className="text-white font-medium">{doc.destinationLocation?.name}</span>
                      <span className="text-[10px] text-[#6E655C] block font-mono">
                        {doc.destinationLocation?.code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {doc.items.map((it: any) => (
                        <div key={it.id} className="text-[#C3B4AA]">
                          <span>{it.product?.name}</span> &bull;{" "}
                          <strong className="text-emerald-400 font-mono">+{it.quantity} {it.product?.uom}</strong>
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.status === "DONE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-[#AD543C]/10 text-[#e0a08a] border border-[#AD543C]/20"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {doc.status !== "DONE" ? (
                        <button
                          onClick={() => handleValidate(doc.id)}
                          disabled={actionLoading}
                          id={`validate-receipt-${doc.referenceNumber}`}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Validate &amp; Post Stock</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#6E655C] flex items-center justify-end gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Stock + Posted</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
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
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Inbound Receipt</h3>
                  <p className="text-xs text-[#988879]">Receive goods from vendor into warehouse</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-[#988879] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#C3B4AA] font-semibold mb-1">
                  Supplier / Vendor Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Kuka Robotics Supply Co."
                  className="glass-input w-full px-3 py-2 rounded-xl text-white placeholder-[#6E655C]"
                />
              </div>

              <div>
                <label className="block text-[#C3B4AA] font-semibold mb-1">
                  Destination Sub-Location <span className="text-rose-400">*</span>
                </label>
                <select
                  value={destLocationId}
                  onChange={(e) => setDestLocationId(e.target.value)}
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
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#C3B4AA] font-semibold mb-1">Quantity</label>
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
                <label className="block text-[#C3B4AA] font-semibold mb-1">Notes / PO Reference</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. PO-2026-9901"
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
                  Create Receipt Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
