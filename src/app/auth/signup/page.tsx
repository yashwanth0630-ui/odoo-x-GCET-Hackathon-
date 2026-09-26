"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Boxes,
  Shield,
  Warehouse,
  Check,
  Building2,
  MapPin,
  Loader2,
} from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"INVENTORY_MANAGER" | "WAREHOUSE_STAFF">("WAREHOUSE_STAFF");
  const [department, setDepartment] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          department: department || undefined,
          warehouseLocation: warehouseLocation || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Failed to create account.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message || "Account created! Redirecting to dashboard...");
      
      setTimeout(() => {
        router.push(data.redirectTo || "/dashboard");
        router.refresh();
      }, 700);
    } catch (err) {
      setErrorMessage("Network error: Could not reach the server.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl relative border border-[#C3B4AA]/12 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-[#AD543C]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-[#AD543C]/10 border border-[#AD543C]/20 text-[#AD543C] mb-3 shadow-inner">
            <Boxes className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Create StockSense Account
          </h1>
          <p className="text-sm text-[#988879] mt-1">
            Join the centralized real-time inventory management network
          </p>
        </div>

        {/* Feedback alerts */}
        {errorMessage && (
          <div
            id="signup-error-alert"
            className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5 animate-fadeIn"
          >
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            id="signup-success-alert"
            className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5 animate-fadeIn"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Role Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#C3B4AA] uppercase tracking-wider mb-2">
              Select Your Operational Role <span className="text-[#AD543C]">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Warehouse Staff Card */}
              <div
                id="role-option-staff"
                onClick={() => setRole("WAREHOUSE_STAFF")}
                className={`p-4 rounded-xl cursor-pointer transition-all border text-left flex flex-col justify-between ${
                  role === "WAREHOUSE_STAFF"
                    ? "bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/50"
                    : "bg-[#2e2823]/60 border-[#C3B4AA]/12 hover:border-white/20 opacity-80 hover:opacity-100"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Warehouse className="w-5 h-5" />
                    </div>
                    {role === "WAREHOUSE_STAFF" && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm text-white">Warehouse Staff</h3>
                  <p className="text-xs text-[#988879] mt-1">
                    Floor execution: Barcode scanning, intake, dispatch, &amp; register log updates.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#C3B4AA]/8 text-[11px] text-emerald-400/90 font-mono">
                  &bull; Fast mobile intake &bull; Scan SKUs
                </div>
              </div>

              {/* Inventory Manager Card */}
              <div
                id="role-option-manager"
                onClick={() => setRole("INVENTORY_MANAGER")}
                className={`p-4 rounded-xl cursor-pointer transition-all border text-left flex flex-col justify-between ${
                  role === "INVENTORY_MANAGER"
                    ? "bg-[#3a1f16]/40 border-[#AD543C] ring-2 ring-[#AD543C]/30 shadow-lg shadow-indigo-950/50"
                    : "bg-[#2e2823]/60 border-[#C3B4AA]/12 hover:border-white/20 opacity-80 hover:opacity-100"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-[#AD543C]/10 text-[#AD543C]">
                      <Shield className="w-5 h-5" />
                    </div>
                    {role === "INVENTORY_MANAGER" && (
                      <div className="w-5 h-5 rounded-full bg-[#c06244] text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm text-white">Inventory Manager</h3>
                  <p className="text-xs text-[#988879] mt-1">
                    Executive oversight: Valuation, audit logs, team control, and stock adjustments.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#C3B4AA]/8 text-[11px] text-[#AD543C]/90 font-mono">
                  &bull; Global oversight &bull; Reconciliations
                </div>
              </div>
            </div>
          </div>

          {/* Full Name & Email Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold text-[#C3B4AA] uppercase tracking-wider mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#988879] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Hayes"
                  className="glass-input w-full pl-10 pr-3 py-2 rounded-xl text-sm text-white placeholder-[#6E655C] focus:outline-none focus:border-[#AD543C]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold text-[#C3B4AA] uppercase tracking-wider mb-1.5"
              >
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#988879] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="glass-input w-full pl-10 pr-3 py-2 rounded-xl text-sm text-white placeholder-[#6E655C] focus:outline-none focus:border-[#AD543C]"
                />
              </div>
            </div>
          </div>

          {/* Role specific metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="signup-dept"
                className="block text-xs font-semibold text-[#C3B4AA] uppercase tracking-wider mb-1.5"
              >
                Department <span className="text-[#6E655C] font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#988879] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-dept"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Supply Chain / Operations"
                  className="glass-input w-full pl-10 pr-3 py-2 rounded-xl text-sm text-white placeholder-[#6E655C] focus:outline-none focus:border-[#AD543C]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-warehouse"
                className="block text-xs font-semibold text-[#C3B4AA] uppercase tracking-wider mb-1.5"
              >
                Assigned Warehouse / Zone
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#988879] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-warehouse"
                  type="text"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  placeholder="e.g. Hub North - Dock 02"
                  className="glass-input w-full pl-10 pr-3 py-2 rounded-xl text-sm text-white placeholder-[#6E655C] focus:outline-none focus:border-[#AD543C]"
                />
              </div>
            </div>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-semibold text-[#C3B4AA] uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#988879] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="glass-input w-full pl-10 pr-10 py-2 rounded-xl text-sm text-white placeholder-[#6E655C] focus:outline-none focus:border-[#AD543C]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#988879] hover:text-[#C3B4AA]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-confirm-password"
                className="block text-xs font-semibold text-[#C3B4AA] uppercase tracking-wider mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#988879] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-confirm-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="glass-input w-full pl-10 pr-3 py-2 rounded-xl text-sm text-white placeholder-[#6E655C] focus:outline-none focus:border-[#AD543C]"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="signup-submit-button"
            disabled={isLoading}
            className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-[#AD543C] to-[#c06244] hover:from-[#c06244] hover:to-[#d4886e] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#AD543C]/30 hover:shadow-[#AD543C]/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating StockSense Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration &amp; Open Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-5 pt-4 border-t border-[#C3B4AA]/8 text-center">
          <p className="text-xs text-[#988879]">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-[#AD543C] hover:text-[#e0a08a] font-semibold hover:underline"
            >
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
