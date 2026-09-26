"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Boxes,
  Shield,
  Warehouse,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Demo user quick-fill helper
  const fillDemoCredentials = (role: "manager" | "staff") => {
    setErrorMessage("");
    if (role === "manager") {
      setEmail("manager@stocksense.io");
      setPassword("Manager123!");
    } else {
      setEmail("staff@stocksense.io");
      setPassword("Staff123!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Invalid credentials. Please verify and try again.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message || "Login successful! Redirecting to dashboard...");
      
      // Smooth redirect to /dashboard
      setTimeout(() => {
        router.push(data.redirectTo || "/dashboard");
        router.refresh();
      }, 700);
    } catch (err) {
      setErrorMessage("Network error: Unable to connect to server. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Outer Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl relative border border-[#C3B4AA]/12 overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#AD543C]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-[#AD543C]/10 border border-[#AD543C]/20 text-[#AD543C] mb-3 shadow-inner">
            <Boxes className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Sign In to StockSense
          </h1>
          <p className="text-sm text-[#988879] mt-1">
            Access centralized, real-time inventory management
          </p>
        </div>

        {/* Demo Fast-Fill Bar */}
        <div className="mb-6 p-3 rounded-xl bg-[#2e2823]/80 border border-[#C3B4AA]/8">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[#988879] font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#AD543C]" />
              Quick Demo Accounts:
            </span>
            <span className="text-[11px] text-[#6E655C]">Click to autofill</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="demo-manager-btn"
              onClick={() => fillDemoCredentials("manager")}
              className="flex items-center gap-2 p-2 rounded-lg bg-[#3a1f16]/40 hover:bg-[#AD543C]/20 border border-[#AD543C]/30 text-left transition-all group"
            >
              <Shield className="w-4 h-4 text-[#AD543C] shrink-0 group-hover:scale-110 transition-transform" />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-[#e0a08a] truncate">Inventory Manager</p>
                <p className="text-[10px] text-[#e0a08a]/70 truncate">manager@stocksense.io</p>
              </div>
            </button>

            <button
              type="button"
              id="demo-staff-btn"
              onClick={() => fillDemoCredentials("staff")}
              className="flex items-center gap-2 p-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-left transition-all group"
            >
              <Warehouse className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-emerald-200 truncate">Warehouse Staff</p>
                <p className="text-[10px] text-emerald-300/70 truncate">staff@stocksense.io</p>
              </div>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div
            id="login-error-alert"
            className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5 animate-fadeIn"
          >
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            id="login-success-alert"
            className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5 animate-fadeIn"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-[#C3B4AA] uppercase tracking-wider mb-1.5"
            >
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-[#988879] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="glass-input w-full pl-11 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-[#6E655C] focus:outline-none focus:border-[#AD543C]"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[#C3B4AA] uppercase tracking-wider"
              >
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-[#AD543C] hover:text-[#e0a08a] hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-[#988879] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="glass-input w-full pl-11 pr-11 py-2.5 rounded-xl text-sm text-white placeholder-[#6E655C] focus:outline-none focus:border-[#AD543C]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#988879] hover:text-[#C3B4AA] transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#584D44] bg-[#2e2823] text-[#AD543C] focus:ring-[#AD543C]/30"
              />
              <span className="text-xs text-[#988879]">Remember session for 7 days</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="login-submit-button"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#AD543C] to-[#c06244] hover:from-[#c06244] hover:to-[#d4886e] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#AD543C]/30 hover:shadow-[#AD543C]/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 pt-5 border-t border-[#C3B4AA]/8 text-center">
          <p className="text-xs text-[#988879]">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/auth/signup"
              className="text-[#AD543C] hover:text-[#e0a08a] font-semibold hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
