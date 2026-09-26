"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import {
  Boxes,
  Shield,
  Warehouse,
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowDownToLine,
  Truck,
  ArrowRightLeft,
  Scale,
  History,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Building,
  Filter,
  Layers,
  ChevronRight,
  Loader2,
  Clock,
  Sparkles,
  FileCheck2,
} from "lucide-react";

interface DashboardClientProps {
  initialUser: any;
}

export default function DashboardClient({ initialUser }: DashboardClientProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic Filters (Required by Task 5)
  const [filterDocType, setFilterDocType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterWarehouse, setFilterWarehouse] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, whRes, catRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/locations"),
        fetch("/api/categories"),
      ]);

      const analyticsData = await analyticsRes.json();
      const whData = await whRes.json();
      const catData = await catRes.json();

      if (analyticsData.success) setAnalytics(analyticsData);
      if (whData.success) setWarehouses(whData.warehouses);
      if (catData.success) setCategories(catData.categories);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered documents for recent activities
  const filteredDocuments = useMemo(() => {
    if (!analytics?.recentDocuments) return [];

    return analytics.recentDocuments.filter((doc: any) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        doc.referenceNumber.toLowerCase().includes(q) ||
        (doc.partnerName && doc.partnerName.toLowerCase().includes(q)) ||
        doc.items.some((it: any) => it.product?.name.toLowerCase().includes(q));

      const matchesType = filterDocType === "ALL" || doc.type === filterDocType;
      const matchesStatus = filterStatus === "ALL" || doc.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [analytics, filterDocType, filterStatus, searchQuery]);

  const metrics = analytics?.metrics || {
    totalProductsCatalog: 0,
    totalUnitsInStock: 0,
    lowStockCount: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    pendingTransfers: 0,
  };

  const lowStockAlerts = analytics?.lowStockAlerts || [];

  return (
    <AppLayout user={initialUser}>
      <div className="space-y-6">
        {/* AUTOMATED LOW-STOCK VISUAL ALERT BANNER (Task 5) */}
        {lowStockAlerts.length > 0 && (
          <div
            id="low-stock-alert-banner"
            className="rounded-2xl p-4 bg-gradient-to-r from-rose-950/80 via-amber-950/50 to-slate-900 border border-rose-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fadeIn"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Reordering Alert: {lowStockAlerts.length} SKU(s) Breached Minimum Threshold</span>
                  <span className="text-[10px] bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded-full font-mono uppercase font-bold">
                    Action Needed
                  </span>
                </h3>
                <p className="text-xs text-[#C3B4AA] mt-0.5">
                  Automated reordering rules flagged items requiring immediate supplier purchase orders:{" "}
                  <strong className="text-amber-300">
                    {lowStockAlerts.map((i: any) => `${i.name} (${i.totalStock}/${i.minThreshold} ${i.uom})`).join(", ")}
                  </strong>
                </p>
              </div>
            </div>

            <Link
              href="/operations/receipts"
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shrink-0 shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Draft Supplier PO Receipt</span>
            </Link>
          </div>
        )}

        {/* TOP WELCOME & METRICS RIBBON */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#AD543C] text-xs font-semibold uppercase tracking-wider mb-1">
              <Boxes className="w-4 h-4" />
              <span>Centralized Real-Time Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Inventory Cockpit &bull; Overview
            </h1>
            <p className="text-xs sm:text-sm text-[#988879] mt-0.5">
              Live operational telemetry replacing manual registers with real-time accuracy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              title="Refresh telemetry"
              className="p-2.5 rounded-xl bg-[#2e2823]/80 hover:bg-[#584D44] border border-[#C3B4AA]/12 text-[#988879] hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* 5 KPI WIDGETS (Required by Task 5) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Widget 1: Total Products in Stock */}
          <Link
            href="/products"
            className="glass-panel p-4 rounded-2xl border border-[#C3B4AA]/12 hover:border-[#AD543C]/40 transition-all group"
          >
            <div className="flex items-center justify-between text-[#988879] mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Products in Stock</span>
              <Package className="w-4 h-4 text-[#AD543C] group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">{metrics.totalProductsCatalog} SKUs</div>
            <span className="text-[10px] text-emerald-400 mt-1 block">
              {metrics.totalUnitsInStock.toLocaleString()} Total Units
            </span>
          </Link>

          {/* Widget 2: Low Stock / Out of Stock */}
          <Link
            href="/products"
            className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-950/10 hover:border-amber-500/60 transition-all group"
          >
            <div className="flex items-center justify-between text-amber-300 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Low Stock Items</span>
              <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-amber-300 font-mono">{metrics.lowStockCount} Items</div>
            <span className="text-[10px] text-amber-400/80 mt-1 block">
              {metrics.outOfStockCount > 0 ? `${metrics.outOfStockCount} Out of Stock` : "Below reorder rules"}
            </span>
          </Link>

          {/* Widget 3: Pending Receipts */}
          <Link
            href="/operations/receipts"
            className="glass-panel p-4 rounded-2xl border border-[#C3B4AA]/12 hover:border-[#AD543C]/40 transition-all group"
          >
            <div className="flex items-center justify-between text-[#988879] mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Receipts</span>
              <ArrowDownToLine className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">{metrics.pendingReceipts} Inbound</div>
            <span className="text-[10px] text-[#988879] mt-1 block">Supplier orders incoming</span>
          </Link>

          {/* Widget 4: Pending Deliveries */}
          <Link
            href="/operations/deliveries"
            className="glass-panel p-4 rounded-2xl border border-[#C3B4AA]/12 hover:border-[#AD543C]/40 transition-all group"
          >
            <div className="flex items-center justify-between text-[#988879] mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Deliveries</span>
              <Truck className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">{metrics.pendingDeliveries} Outbound</div>
            <span className="text-[10px] text-[#988879] mt-1 block">Orders to pick &amp; pack</span>
          </Link>

          {/* Widget 5: Internal Transfers Scheduled */}
          <Link
            href="/operations/move-history"
            className="glass-panel p-4 rounded-2xl border border-[#C3B4AA]/12 hover:border-[#AD543C]/40 transition-all group col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between text-[#988879] mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Transfers Scheduled</span>
              <ArrowRightLeft className="w-4 h-4 text-[#AD543C] group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">{metrics.pendingTransfers} Internal</div>
            <span className="text-[10px] text-[#988879] mt-1 block">Location-to-location moves</span>
          </Link>
        </div>

        {/* DYNAMIC FILTERS BAR (Required by Task 5) */}
        <div className="glass-panel p-4 rounded-2xl border border-[#C3B4AA]/12 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider border-b border-[#C3B4AA]/8 pb-2">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#AD543C]" />
              Dynamic Operations &amp; Ledger Filters
            </span>
            <button
              onClick={() => {
                setFilterDocType("ALL");
                setFilterStatus("ALL");
                setFilterWarehouse("ALL");
                setFilterCategory("ALL");
                setSearchQuery("");
              }}
              className="text-[11px] text-[#AD543C] hover:text-[#e0a08a] font-normal"
            >
              Reset All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
            {/* Search */}
            <div>
              <label className="block text-[10px] text-[#988879] font-semibold mb-1 uppercase">Search Ref / Item</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#6E655C] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="WH/IN, SKU..."
                  className="glass-input w-full pl-8 pr-2.5 py-1.5 rounded-lg text-white text-xs"
                />
              </div>
            </div>

            {/* Document Type Filter */}
            <div>
              <label className="block text-[10px] text-[#988879] font-semibold mb-1 uppercase">Document Type</label>
              <select
                value={filterDocType}
                onChange={(e) => setFilterDocType(e.target.value)}
                className="glass-input w-full px-2.5 py-1.5 rounded-lg text-white bg-[#2e2823] text-xs"
              >
                <option value="ALL">All Documents</option>
                <option value="RECEIPT">Receipts (Incoming)</option>
                <option value="DELIVERY">Delivery (Outgoing)</option>
                <option value="INTERNAL_TRANSFER">Internal Transfers</option>
                <option value="ADJUSTMENT">Stock Adjustments</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[10px] text-[#988879] font-semibold mb-1 uppercase">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="glass-input w-full px-2.5 py-1.5 rounded-lg text-white bg-[#2e2823] text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="WAITING">Waiting (Picking)</option>
                <option value="READY">Ready for Dispatch</option>
                <option value="DONE">Done (Validated)</option>
                <option value="CANCELED">Canceled</option>
              </select>
            </div>

            {/* Warehouse Filter */}
            <div>
              <label className="block text-[10px] text-[#988879] font-semibold mb-1 uppercase">Warehouse / Hub</label>
              <select
                value={filterWarehouse}
                onChange={(e) => setFilterWarehouse(e.target.value)}
                className="glass-input w-full px-2.5 py-1.5 rounded-lg text-white bg-[#2e2823] text-xs"
              >
                <option value="ALL">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Product Category Filter */}
            <div>
              <label className="block text-[10px] text-[#988879] font-semibold mb-1 uppercase">Product Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="glass-input w-full px-2.5 py-1.5 rounded-lg text-white bg-[#2e2823] text-xs"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* DUAL STREAM: RECENT OPERATIONS & CENTRALIZED STOCK LEDGER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stream 1: Recent Operations Filtered Feed */}
          <div className="glass-panel rounded-2xl border border-[#C3B4AA]/12 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#AD543C]" />
                <span>Filtered Operations Stream</span>
              </h2>
              <span className="text-[11px] text-[#988879] font-mono">
                {filteredDocuments.length} document(s)
              </span>
            </div>

            <div className="space-y-2">
              {filteredDocuments.length === 0 ? (
                <div className="p-8 text-center text-[#6E655C] text-xs">
                  No operational documents match current filters.
                </div>
              ) : (
                filteredDocuments.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl bg-[#2e2823]/60 border border-[#C3B4AA]/8 hover:border-[#C3B4AA]/12 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#e0a08a]">{doc.referenceNumber}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            doc.status === "DONE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : doc.status === "READY"
                              ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                              : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                      <p className="text-[#988879] text-[11px] mt-0.5">
                        {doc.partnerName || "Internal Facility Move"} &bull;{" "}
                        {doc.items.map((it: any) => `${it.product?.name} (Qty ${it.quantity})`).join(", ")}
                      </p>
                    </div>

                    <Link
                      href={
                        doc.type === "RECEIPT"
                          ? "/operations/receipts"
                          : doc.type === "DELIVERY"
                          ? "/operations/deliveries"
                          : "/operations/move-history"
                      }
                      className="p-1.5 rounded-lg bg-[#584D44] hover:bg-[#6E655C] text-[#C3B4AA] hover:text-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stream 2: Centralized Stock Ledger Feed */}
          <div className="glass-panel rounded-2xl border border-[#C3B4AA]/12 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                <span>Real-Time Stock Ledger Feed</span>
              </h2>
              <Link
                href="/operations/move-history"
                className="text-xs text-[#AD543C] hover:text-[#e0a08a] flex items-center gap-1"
              >
                <span>Full Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2">
              {!analytics?.recentMovements || analytics.recentMovements.length === 0 ? (
                <div className="p-8 text-center text-[#6E655C] text-xs">
                  No stock ledger entries recorded yet.
                </div>
              ) : (
                analytics.recentMovements.map((move: any) => (
                  <div
                    key={move.id}
                    className="p-3 rounded-xl bg-[#2e2823]/60 border border-[#C3B4AA]/8 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-white">{move.product?.name}</span>
                        <span className="text-[10px] text-[#6E655C] font-mono">({move.product?.sku})</span>
                      </div>
                      <p className="text-[11px] text-[#988879] mt-0.5">
                        {move.sourceLocation ? `${move.sourceLocation.name} → ` : "Inbound Vendor → "}
                        {move.destinationLocation ? move.destinationLocation.name : "Customer Outbound"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono font-bold text-sm ${
                          move.quantity > 0
                            ? "text-emerald-400"
                            : move.quantity < 0
                            ? "text-rose-400"
                            : "text-[#C3B4AA]"
                        }`}
                      >
                        {move.quantity > 0 ? `+${move.quantity}` : move.quantity} {move.product?.uom}
                      </span>
                      <span className="block text-[10px] text-[#6E655C] uppercase font-semibold">
                        {move.type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
