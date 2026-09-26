"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import {
  History,
  Search,
  ArrowDownToLine,
  Truck,
  ArrowRightLeft,
  Scale,
  RefreshCw,
  Download,
  Loader2,
  Building,
} from "lucide-react";

interface MoveHistoryClientProps {
  user: any;
}

export default function MoveHistoryClient({ user }: MoveHistoryClientProps) {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ledger");
      const data = await res.json();
      if (data.success) {
        setMovements(data.movements);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMovements = movements.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      m.reference.toLowerCase().includes(q) ||
      m.product?.name.toLowerCase().includes(q) ||
      m.product?.sku.toLowerCase().includes(q) ||
      (m.reason && m.reason.toLowerCase().includes(q));

    const matchesType = typeFilter === "ALL" || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const exportCSV = () => {
    const headers = [
      "Reference",
      "Timestamp",
      "SKU",
      "Product Name",
      "Type",
      "Quantity",
      "Source Location",
      "Destination Location",
      "Operator",
      "Reason",
    ];

    const rows = filteredMovements.map((m) => [
      `"${m.reference}"`,
      `"${new Date(m.createdAt).toISOString()}"`,
      `"${m.product?.sku}"`,
      `"${m.product?.name}"`,
      `"${m.type}"`,
      m.quantity,
      `"${m.sourceLocation ? m.sourceLocation.name : ""}"`,
      `"${m.destinationLocation ? m.destinationLocation.name : ""}"`,
      `"${m.operator ? m.operator.name : ""}"`,
      `"${m.reason || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stocksense_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <History className="w-4 h-4" />
              <span>Immutable Audit Trail</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Move History &bull; Centralized Stock Ledger
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Complete historical record of every receipt, customer dispatch, internal relocation, and cycle count adjustment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              id="export-ledger-csv-btn"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Ledger CSV</span>
            </button>
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, SKU, item name, or reason..."
              className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs text-white placeholder-slate-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {[
              { id: "ALL", label: "All Movements" },
              { id: "INCOMING", label: "Receipts (+)" },
              { id: "OUTGOING", label: "Deliveries (-)" },
              { id: "INTERNAL", label: "Transfers" },
              { id: "ADJUSTMENT", label: "Adjustments" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setTypeFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  typeFilter === st.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-900/60 text-slate-400 hover:text-white"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-white/10 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-4">Movement Type</th>
                <th className="py-3 px-4">Signed Quantity</th>
                <th className="py-3 px-4">From Location</th>
                <th className="py-3 px-4">To Location</th>
                <th className="py-3 px-4">Logged Operator</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-indigo-400" />
                    <span>Querying centralized ledger records...</span>
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No ledger transactions found matching filters.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                      {m.reference}
                      {m.reason && (
                        <p className="text-[10px] text-slate-500 font-normal truncate max-w-[180px]">
                          {m.reason}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{m.product?.name}</div>
                      <span className="font-mono text-[10px] text-indigo-400">{m.product?.sku}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.type === "INCOMING"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : m.type === "OUTGOING"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : m.type === "INTERNAL"
                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                            : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                        }`}
                      >
                        {m.type === "INCOMING" && <ArrowDownToLine className="w-3 h-3" />}
                        {m.type === "OUTGOING" && <Truck className="w-3 h-3" />}
                        {m.type === "INTERNAL" && <ArrowRightLeft className="w-3 h-3" />}
                        {m.type === "ADJUSTMENT" && <Scale className="w-3 h-3" />}
                        <span>{m.type}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sm">
                      <span
                        className={
                          m.quantity > 0
                            ? "text-emerald-400"
                            : m.quantity < 0
                            ? "text-rose-400"
                            : "text-slate-400"
                        }
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.product?.uom}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {m.sourceLocation ? (
                        <div>
                          <span>{m.sourceLocation.name}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {m.sourceLocation.code}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">Vendor / External</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {m.destinationLocation ? (
                        <div>
                          <span>{m.destinationLocation.name}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {m.destinationLocation.code}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">Customer / Shipped</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {m.operator?.name || "System Automated"}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
