"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Building,
  MapPin,
  Barcode,
  Layers,
  Edit2,
  Trash2,
  Eye,
  ArrowUpDown,
  RefreshCw,
  X,
  Loader2,
  TrendingDown,
  Warehouse as WarehouseIcon,
  Tag,
  DollarSign,
  Boxes,
} from "lucide-react";
import Navigation from "@/components/Navigation";

interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  productCount?: number;
}

interface WarehouseLocation {
  id: string;
  name: string;
  code: string;
  type: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
}

interface StockLevel {
  id: string;
  locationId: string;
  locationName: string;
  locationCode: string;
  locationType: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  quantity: number;
  updatedAt: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  uom: string;
  minThreshold: number;
  idealStock: number;
  initialStock: number;
  costPrice?: number | null;
  sellingPrice?: number | null;
  totalStock: number;
  isLowStock: boolean;
  isCritical: boolean;
  stockLevels: StockLevel[];
  createdAt: string;
  updatedAt: string;
}

interface WarehouseData {
  id: string;
  name: string;
  code: string;
  address?: string;
  locations: {
    id: string;
    name: string;
    code: string;
    type: string;
  }[];
}

interface ProductsClientProps {
  initialUser: {
    name: string;
    email: string;
    role: string;
    roleLabel: string;
  };
}

export default function ProductsClient({ initialUser }: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [stockStatusFilter, setStockStatusFilter] = useState<"ALL" | "LOW_STOCK" | "IN_STOCK">("ALL");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form states for Create/Edit
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formBarcode, setFormBarcode] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formUom, setFormUom] = useState("Units");
  const [formMinThreshold, setFormMinThreshold] = useState(15);
  const [formIdealStock, setFormIdealStock] = useState(60);
  const [formCostPrice, setFormCostPrice] = useState<number | "">("");
  const [formSellingPrice, setFormSellingPrice] = useState<number | "">("");
  const [formInitialStock, setFormInitialStock] = useState(0);
  const [formInitialLocationId, setFormInitialLocationId] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Location stock adjustment state inside Detail Modal
  const [adjustLocationId, setAdjustLocationId] = useState("");
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustOp, setAdjustOp] = useState<"ADD" | "SUBTRACT" | "SET">("ADD");

  // Load Initial Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, locRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
        fetch("/api/locations"),
      ]);

      const prodData = await prodRes.json();
      const catData = await catRes.json();
      const locData = await locRes.json();

      if (prodData.success) setProducts(prodData.products);
      if (catData.success) {
        setCategories(catData.categories);
        if (catData.categories.length > 0 && !formCategoryId) {
          setFormCategoryId(catData.categories[0].id);
        }
      }
      if (locData.success) {
        setWarehouses(locData.warehouses);
        if (locData.warehouses.length > 0 && locData.warehouses[0].locations.length > 0) {
          setFormInitialLocationId(locData.warehouses[0].locations[0].id);
          setAdjustLocationId(locData.warehouses[0].locations[0].id);
        }
      }
    } catch (err) {
      showToast("error", "Failed to load inventory product catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Flatten all sub-locations for easy dropdown selection
  const allSubLocations = useMemo(() => {
    const list: { id: string; label: string; warehouseName: string }[] = [];
    warehouses.forEach((wh) => {
      wh.locations.forEach((loc) => {
        list.push({
          id: loc.id,
          label: `${wh.name} → ${loc.name} (${loc.code})`,
          warehouseName: wh.name,
        });
      });
    });
    return list;
  }, [warehouses]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));

      const matchesCat =
        selectedCategory === "ALL" || p.categoryId === selectedCategory;

      let matchesStock = true;
      if (stockStatusFilter === "LOW_STOCK") {
        matchesStock = p.isLowStock;
      } else if (stockStatusFilter === "IN_STOCK") {
        matchesStock = !p.isLowStock && p.totalStock > 0;
      }

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, stockStatusFilter]);

  // Catalog Statistics
  const stats = useMemo(() => {
    const totalSKUs = products.length;
    const lowStockCount = products.filter((p) => p.isLowStock).length;
    const totalUnits = products.reduce((acc, p) => acc + p.totalStock, 0);
    const totalCategories = categories.length;
    return { totalSKUs, lowStockCount, totalUnits, totalCategories };
  }, [products, categories]);

  // Open Create Modal
  const openCreateModal = () => {
    setFormName("");
    setFormSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormBarcode(`8901${Math.floor(100000000 + Math.random() * 900000000)}`);
    if (categories.length > 0) setFormCategoryId(categories[0].id);
    setFormUom("Units");
    setFormMinThreshold(20);
    setFormIdealStock(80);
    setFormCostPrice("");
    setFormSellingPrice("");
    setFormInitialStock(50);
    if (allSubLocations.length > 0) setFormInitialLocationId(allSubLocations[0].id);
    setFormDescription("");
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormName(product.name);
    setFormSku(product.sku);
    setFormBarcode(product.barcode || "");
    setFormCategoryId(product.categoryId);
    setFormUom(product.uom);
    setFormMinThreshold(product.minThreshold);
    setFormIdealStock(product.idealStock);
    setFormCostPrice(product.costPrice || "");
    setFormSellingPrice(product.sellingPrice || "");
    setFormDescription(product.description || "");
    setShowEditModal(true);
  };

  // Open Detail View Modal
  const openDetailModal = (product: Product) => {
    setSelectedProduct(product);
    if (allSubLocations.length > 0) {
      setAdjustLocationId(allSubLocations[0].id);
    }
    setShowDetailModal(true);
  };

  // Open Delete Confirmation
  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  // Submit Create Product
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          sku: formSku,
          barcode: formBarcode || undefined,
          categoryId: formCategoryId,
          uom: formUom,
          minThreshold: formMinThreshold,
          idealStock: formIdealStock,
          costPrice: formCostPrice !== "" ? formCostPrice : undefined,
          sellingPrice: formSellingPrice !== "" ? formSellingPrice : undefined,
          initialStock: formInitialStock,
          initialLocationId: formInitialLocationId || undefined,
          description: formDescription || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.message || "Failed to create product.");
        setActionLoading(false);
        return;
      }

      showToast("success", data.message || "Product created successfully.");
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      showToast("error", "Network error while saving product.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Edit Product
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          sku: formSku,
          barcode: formBarcode || undefined,
          categoryId: formCategoryId,
          uom: formUom,
          minThreshold: formMinThreshold,
          idealStock: formIdealStock,
          costPrice: formCostPrice !== "" ? formCostPrice : undefined,
          sellingPrice: formSellingPrice !== "" ? formSellingPrice : undefined,
          description: formDescription || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.message || "Failed to update product.");
        setActionLoading(false);
        return;
      }

      showToast("success", "Product updated successfully.");
      setShowEditModal(false);
      loadData();
    } catch (err) {
      showToast("error", "Network error updating product.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Delete Product
  const handleDeleteSubmit = async () => {
    if (!selectedProduct) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.message || "Failed to delete product.");
        setActionLoading(false);
        return;
      }

      showToast("success", data.message || "Product removed.");
      setShowDeleteModal(false);
      loadData();
    } catch (err) {
      showToast("error", "Network error deleting product.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Location Stock Adjustment from Detail Modal
  const handleLocationStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !adjustLocationId) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/products/${selectedProduct.id}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: adjustLocationId,
          quantity: adjustQty,
          operation: adjustOp,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.message || "Stock update failed.");
        setActionLoading(false);
        return;
      }

      showToast("success", data.message || "Location stock updated.");
      
      // Refresh current product's detailed stock levels
      const updatedProdRes = await fetch(`/api/products/${selectedProduct.id}`);
      const updatedProdData = await updatedProdRes.json();
      if (updatedProdData.success) {
        setSelectedProduct(updatedProdData.product);
      }
      loadData();
    } catch (err) {
      showToast("error", "Error updating location stock level.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col">
      {/* Navigation */}
      <Navigation user={initialUser} />

      {/* Toast Notification */}
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Ribbon & Create Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Boxes className="w-4 h-4" />
              <span>Catalog &amp; Multi-Facility Stock</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Products &amp; Location Stock
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage items, track real-time stock availability across sub-locations, and configure automated reordering thresholds.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={openCreateModal}
              id="add-product-btn"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              <span>Add New Product</span>
            </button>
            <button
              onClick={loadData}
              title="Refresh catalog"
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-white/10">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Catalog SKUs</span>
            <div className="text-2xl font-bold text-white font-mono mt-1">{stats.totalSKUs}</div>
            <span className="text-[10px] text-slate-500 mt-1 block">Active across all facilities</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-amber-500/20 bg-amber-950/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-amber-300 uppercase tracking-wider">Low Stock Alerts</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300 font-mono mt-1">{stats.lowStockCount}</div>
            <span className="text-[10px] text-amber-400/80 mt-1 block">At or below reordering threshold</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total On-Hand Units</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {stats.totalUnits.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Summed across all warehouse racks</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Categories</span>
            <div className="text-2xl font-bold text-indigo-300 font-mono mt-1">{stats.totalCategories}</div>
            <span className="text-[10px] text-slate-500 mt-1 block">Organized product taxonomy</span>
          </div>
        </div>

        {/* SMART SEARCH & FILTER BAR */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="product-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Smart Search: Filter by SKU (e.g. SKU-9921), Product Name, or Barcode..."
                className="glass-input w-full pl-10 pr-10 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-56">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="category-filter-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="glass-input w-full pl-8 pr-8 py-2.5 rounded-xl text-xs text-white bg-slate-900 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="ALL">All Categories ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                  ▼
                </div>
              </div>

              {/* Stock Status Pills */}
              <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/10 shrink-0">
                <button
                  onClick={() => setStockStatusFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    stockStatusFilter === "ALL"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStockStatusFilter("LOW_STOCK")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                    stockStatusFilter === "LOW_STOCK"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "text-slate-400 hover:text-amber-300"
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Low Stock ({stats.lowStockCount})</span>
                </button>
                <button
                  onClick={() => setStockStatusFilter("IN_STOCK")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    stockStatusFilter === "IN_STOCK"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "text-slate-400 hover:text-emerald-300"
                  }`}
                >
                  In Stock
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PRODUCTS TABLE */}
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">UoM</th>
                  <th className="py-3 px-4">Reordering Rule</th>
                  <th className="py-3 px-4">Total Stock</th>
                  <th className="py-3 px-4">Locations Breakdown</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                        <span>Loading product inventory...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="font-semibold text-white">No products found</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Try modifying your search or category filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* SKU */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                          {product.sku}
                        </span>
                        {product.barcode && (
                          <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                            <Barcode className="w-3 h-3 text-slate-600" />
                            <span>{product.barcode}</span>
                          </div>
                        )}
                      </td>

                      {/* Product Name & Description */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {product.name}
                        </div>
                        {product.description && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {product.description}
                          </p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-300 border border-white/5">
                          {product.categoryName}
                        </span>
                      </td>

                      {/* Unit of Measure */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {product.uom}
                      </td>

                      {/* Reordering Rules */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11px]">
                          <span className="text-slate-400">Min: </span>
                          <span className="font-mono font-semibold text-white">
                            {product.minThreshold} {product.uom}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Target: {product.idealStock} {product.uom}
                        </div>
                      </td>

                      {/* Total Stock & Status Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-white">
                            {product.totalStock} {product.uom}
                          </span>
                          {product.isCritical ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              OUT OF STOCK
                            </span>
                          ) : product.isLowStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                              LOW STOCK
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              OPTIMAL
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Locations Breakdown */}
                      <td className="py-3.5 px-4">
                        {product.stockLevels.length === 0 ? (
                          <span className="text-slate-500 text-[11px] italic">No stock allocated</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {product.stockLevels.map((sl) => (
                              <span
                                key={sl.id}
                                className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-[10px] text-slate-300"
                                title={`${sl.warehouseName} → ${sl.locationName}`}
                              >
                                <span className="text-slate-500">{sl.locationName.split("-")[0]}:</span>{" "}
                                <span className="font-mono font-bold text-indigo-300">
                                  {sl.quantity}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail / Stock per Location */}
                          <button
                            onClick={() => openDetailModal(product)}
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white transition-colors"
                            title="Stock availability per location"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Product */}
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Edit product parameters"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Product */}
                          <button
                            onClick={() => openDeleteModal(product)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ============================================================== */}
      {/* DETAIL MODAL: STOCK AVAILABILITY PER LOCATION (Required by prompt) */}
      {/* ============================================================== */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{selectedProduct.name}</h2>
                    <span className="font-mono text-xs font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                      {selectedProduct.sku}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Category: <span className="text-slate-200">{selectedProduct.categoryName}</span> &bull; UoM:{" "}
                    <span className="text-slate-200">{selectedProduct.uom}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Reordering Rules Health Gauge */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider">
                    Reorder Rule Compliance:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Total Available:</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {selectedProduct.totalStock} {selectedProduct.uom}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedProduct.isCritical
                        ? "bg-rose-500"
                        : selectedProduct.isLowStock
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (selectedProduct.totalStock / (selectedProduct.idealStock || 100)) * 100
                      )}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Minimum Threshold: <strong className="text-amber-400 font-mono">{selectedProduct.minThreshold} {selectedProduct.uom}</strong></span>
                  <span>Target Stock: <strong className="text-indigo-400 font-mono">{selectedProduct.idealStock} {selectedProduct.uom}</strong></span>
                </div>
              </div>

              {/* STOCK AVAILABILITY PER LOCATION (Table) */}
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Building className="w-4 h-4 text-indigo-400" />
                  <span>Stock Availability per Location</span>
                </h3>

                {selectedProduct.stockLevels.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-900/40 border border-white/5 text-center text-xs text-slate-400">
                    No physical stock recorded in any sub-location yet. Allocate stock using the quick form below.
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                          <th className="py-2.5 px-3">Warehouse</th>
                          <th className="py-2.5 px-3">Sub-Location / Bay</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3 text-right">Available Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-slate-950/40">
                        {selectedProduct.stockLevels.map((sl) => (
                          <tr key={sl.id} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-3 text-white font-medium flex items-center gap-1.5">
                              <WarehouseIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{sl.warehouseName}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-indigo-300">{sl.locationName}</span>
                              <span className="text-[10px] text-slate-500 ml-1 font-mono">({sl.locationCode})</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 uppercase">
                                {sl.locationType}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-sm text-emerald-400">
                              {sl.quantity} {selectedProduct.uom}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Quick Stock Adjustment per Location */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Adjust Stock at Location</span>
                </h4>

                <form onSubmit={handleLocationStockAdjust} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Target Sub-Location</label>
                    <select
                      value={adjustLocationId}
                      onChange={(e) => setAdjustLocationId(e.target.value)}
                      className="glass-input w-full px-2.5 py-2 rounded-lg text-white bg-slate-900"
                    >
                      {allSubLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Action</label>
                    <select
                      value={adjustOp}
                      onChange={(e) => setAdjustOp(e.target.value as any)}
                      className="glass-input w-full px-2.5 py-2 rounded-lg text-white bg-slate-900"
                    >
                      <option value="ADD">+ Add Stock</option>
                      <option value="SUBTRACT">- Dispatch</option>
                      <option value="SET">= Set Absolute</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Quantity</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min={1}
                        required
                        value={adjustQty}
                        onChange={(e) => setAdjustQty(Number(e.target.value))}
                        className="glass-input w-full px-2.5 py-2 rounded-lg text-white font-mono text-center"
                      />
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Created: {new Date(selectedProduct.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CREATE PRODUCT MODAL */}
      {/* ============================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create New Catalog Product</h3>
                  <p className="text-xs text-slate-400">Add item, UoM, reordering rules, and initial location stock</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Product Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Servo Motor 48V"
                    className="glass-input w-full px-3 py-2 rounded-xl text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    SKU / Unique Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                    placeholder="e.g. SKU-8820"
                    className="glass-input w-full px-3 py-2 rounded-xl text-white font-mono placeholder-slate-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-xl text-white bg-slate-900"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unit of Measure (UoM)</label>
                  <select
                    value={formUom}
                    onChange={(e) => setFormUom(e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-xl text-white bg-slate-900"
                  >
                    <option value="Units">Units (pcs)</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Kg">Kilograms (kg)</option>
                    <option value="Meters">Meters (m)</option>
                    <option value="Pallets">Pallets</option>
                    <option value="Liters">Liters (L)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Barcode / EAN</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="890123456..."
                    className="glass-input w-full px-3 py-2 rounded-xl text-white font-mono placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Reordering Rules Section */}
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                  Reordering Rules &amp; Inventory Thresholds
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Min Threshold (Alert Level) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={formMinThreshold}
                      onChange={(e) => setFormMinThreshold(Number(e.target.value))}
                      className="glass-input w-full px-3 py-2 rounded-xl text-white font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Triggers low-stock warning when stock drops to or below this.
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Target / Ideal Stock</label>
                    <input
                      type="number"
                      min={0}
                      value={formIdealStock}
                      onChange={(e) => setFormIdealStock(Number(e.target.value))}
                      className="glass-input w-full px-3 py-2 rounded-xl text-white font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Desired restock quantity level.
                    </span>
                  </div>
                </div>
              </div>

              {/* Initial Stock Allocation */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-3">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Initial Stock &amp; Location Allocation (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Initial Quantity ({formUom})</label>
                    <input
                      type="number"
                      min={0}
                      value={formInitialStock}
                      onChange={(e) => setFormInitialStock(Number(e.target.value))}
                      className="glass-input w-full px-3 py-2 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Assign to Sub-Location</label>
                    <select
                      value={formInitialLocationId}
                      onChange={(e) => setFormInitialLocationId(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-xl text-white bg-slate-900"
                    >
                      {allSubLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing & Description */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value ? Number(e.target.value) : "")}
                    placeholder="0.00"
                    className="glass-input w-full px-3 py-2 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Selling / Value Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value ? Number(e.target.value) : "")}
                    placeholder="0.00"
                    className="glass-input w-full px-3 py-2 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional engineering notes or warehouse handling specs..."
                  className="glass-input w-full px-3 py-2 rounded-xl text-white placeholder-slate-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Save Product to Catalog</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT PRODUCT MODAL */}
      {/* ============================================================== */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Product</h3>
                  <p className="text-xs text-slate-400">Modify SKU, naming, category, or reordering rules</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                    className="glass-input w-full px-3 py-2 rounded-xl text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-xl text-white bg-slate-900"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unit of Measure (UoM)</label>
                  <select
                    value={formUom}
                    onChange={(e) => setFormUom(e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-xl text-white bg-slate-900"
                  >
                    <option value="Units">Units (pcs)</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Kg">Kilograms (kg)</option>
                    <option value="Meters">Meters (m)</option>
                    <option value="Pallets">Pallets</option>
                    <option value="Liters">Liters (L)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Min Threshold (Alert Level)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formMinThreshold}
                    onChange={(e) => setFormMinThreshold(Number(e.target.value))}
                    className="glass-input w-full px-3 py-2 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target / Ideal Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={formIdealStock}
                    onChange={(e) => setFormIdealStock(Number(e.target.value))}
                    className="glass-input w-full px-3 py-2 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-xl text-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Update Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DELETE PRODUCT MODAL */}
      {/* ============================================================== */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-rose-500/30 shadow-2xl p-6 relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Product</h3>
                <p className="text-xs text-slate-400">This action will remove the product and location stock levels.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 text-xs text-slate-300 mb-5">
              Are you sure you want to remove <strong className="text-white">{selectedProduct.name}</strong> (
              <span className="font-mono text-indigo-400">{selectedProduct.sku}</span>)?
              {selectedProduct.totalStock > 0 && (
                <p className="text-rose-400 font-semibold mt-2">
                  ⚠️ Warning: There are currently {selectedProduct.totalStock} {selectedProduct.uom} recorded across locations!
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 flex items-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Confirm Deletion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
