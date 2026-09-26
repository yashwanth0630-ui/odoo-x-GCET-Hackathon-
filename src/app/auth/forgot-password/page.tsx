"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Timer,
} from "lucide-react";

type ResetStep = "REQUEST_OTP" | "VERIFY_OTP" | "NEW_PASSWORD" | "SUCCESS";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<ResetStep>("REQUEST_OTP");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Dev mode OTP indicator for easy evaluation
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Countdown timer for resend
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Failed to dispatch verification code.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message);
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setCountdown(60);
      setStep("VERIFY_OTP");
      setIsLoading(false);

      // Focus first OTP field
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      setErrorMessage("Network error: Could not reach the server.");
      setIsLoading(false);
    }
  };

  // OTP Input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Paste handling
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || "";
        }
        setOtpDigits(newDigits);
        const nextIndex = Math.min(pasted.length, 5);
        inputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    const cleanChar = value.replace(/\D/g, "");
    const newDigits = [...otpDigits];
    newDigits[index] = cleanChar;
    setOtpDigits(newDigits);

    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fillDevOtp = () => {
    if (devOtp && devOtp.length === 6) {
      const digits = devOtp.split("");
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      setErrorMessage("Please enter all 6 digits of the OTP code.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: fullOtp }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Invalid OTP code.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Code verified! Set your new password.");
      setStep("NEW_PASSWORD");
      setIsLoading(false);
    } catch (err) {
      setErrorMessage("Network error: Could not verify OTP.");
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otpDigits.join(""),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Failed to reset password.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message || "Password updated successfully!");
      setStep("SUCCESS");
      setIsLoading(false);

      // Auto redirect to login
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err) {
      setErrorMessage("Network error: Could not complete password reset.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl relative border border-[#C3B4AA]/12 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#AD543C]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-[#AD543C]/10 border border-[#AD543C]/20 text-[#AD543C] mb-3 shadow-inner">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {step === "REQUEST_OTP" && "Reset Password"}
            {step === "VERIFY_OTP" && "Enter 6-Digit OTP"}
            {step === "NEW_PASSWORD" && "Create New Password"}
            {step === "SUCCESS" && "Password Reset Complete"}
          </h1>
          <p className="text-sm text-[#988879] mt-1">
            {step === "REQUEST_OTP" && "We will send a secure verification code to your email"}
            {step === "VERIFY_OTP" && `Check inbox for ${email}`}
            {step === "NEW_PASSWORD" && "Enter a strong replacement password"}
            {step === "SUCCESS" && "Redirecting you to login..."}
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-between mb-6 px-2">
          {["Email", "Verify OTP", "New Password"].map((label, idx) => {
            const stepIndex =
              step === "REQUEST_OTP" ? 0 : step === "VERIFY_OTP" ? 1 : 2;
            const isCompleted = stepIndex > idx || step === "SUCCESS";
            const isCurrent = stepIndex === idx && step !== "SUCCESS";

            return (
              <div key={label} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : isCurrent
                      ? "bg-[#AD543C] text-white ring-4 ring-[#AD543C]/20"
                      : "bg-[#584D44] text-[#6E655C]"
                  }`}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span
                  className={`text-[10px] mt-1 tracking-wider uppercase ${
                    isCurrent ? "text-[#e0a08a] font-bold" : "text-[#6E655C]"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error / Success Messages */}
        {errorMessage && (
          <div
            id="otp-error-alert"
            className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5 animate-fadeIn"
          >
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            id="otp-success-alert"
            className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5 animate-fadeIn"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Dev Mode OTP Banner (for fast evaluation) */}
        {devOtp && step === "VERIFY_OTP" && (
          <div className="mb-5 p-3 rounded-xl bg-[#AD543C]/10 border border-[#AD543C]/40 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#AD543C]" />
              <div>
                <span className="text-[#C3B4AA]">Generated OTP: </span>
                <span className="font-mono font-bold text-[#e0a08a] tracking-wider">
                  {devOtp}
                </span>
              </div>
            </div>
            <button
              type="button"
              id="autofill-otp-btn"
              onClick={fillDevOtp}
              className="px-2.5 py-1 rounded bg-[#c06244] hover:bg-[#AD543C] text-white font-medium text-[11px] transition-colors"
            >
              Autofill
            </button>
          </div>
        )}

        {/* STEP 1: REQUEST OTP */}
        {step === "REQUEST_OTP" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label
                htmlFor="otp-email"
                className="block text-xs font-semibold text-[#C3B4AA] uppercase tracking-wider mb-1.5"
              >
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-[#988879] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="otp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@stocksense.io or staff@stocksense.io"
                  className="glass-input w-full pl-11 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-[#6E655C] focus:outline-none focus:border-[#AD543C]"
                />
              </div>
            </div>

            <button
              type="submit"
              id="send-otp-btn"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#AD543C] to-[#c06244] hover:from-[#c06244] hover:to-[#d4886e] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#AD543C]/30 transition-all disabled:opacity-50 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching OTP Code...</span>
                </>
              ) : (
                <>
                  <span>Send 6-Digit OTP</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY OTP */}
        {step === "VERIFY_OTP" && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#C3B4AA] uppercase tracking-wider mb-3 text-center">
                6-Digit Security Code
              </label>
              <div className="flex justify-center gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-11 h-12 text-center text-xl font-bold font-mono rounded-xl bg-[#2e2823] border border-[#584D44] text-white focus:outline-none focus:border-[#AD543C] focus:ring-2 focus:ring-[#AD543C]/20"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#988879]">
              <span className="flex items-center gap-1">
                <Timer className="w-3.5 h-3.5" />
                Expires in 10 minutes
              </span>
              {countdown > 0 ? (
                <span>Resend in {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  className="text-[#AD543C] hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>

            <button
              type="submit"
              id="verify-otp-btn"
              disabled={isLoading || otpDigits.join("").length !== 6}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#AD543C] to-[#c06244] hover:from-[#c06244] hover:to-[#d4886e] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#AD543C]/30 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating Code...</span>
                </>
              ) : (
                <span>Verify OTP &amp; Proceed</span>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD */}
        {step === "NEW_PASSWORD" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-semibold text-[#C3B4AA] uppercase tracking-wider mb-1.5"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#988879] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="glass-input w-full pl-11 pr-11 py-2.5 rounded-xl text-sm text-white placeholder-[#6E655C] focus:outline-none focus:border-[#AD543C]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#988879] hover:text-[#C3B4AA]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-new-password"
                className="block text-xs font-semibold text-[#C3B4AA] uppercase tracking-wider mb-1.5"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#988879] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="confirm-new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="glass-input w-full pl-11 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-[#6E655C] focus:outline-none focus:border-[#AD543C]"
                />
              </div>
            </div>

            <button
              type="submit"
              id="save-new-password-btn"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Password &amp; Revoke Sessions</span>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: SUCCESS */}
        {step === "SUCCESS" && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Password Updated!</h2>
              <p className="text-xs text-[#988879] mt-1">
                Your password has been securely updated. Any active sessions were invalidated.
              </p>
            </div>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#AD543C] hover:bg-[#c06244] text-white text-sm font-medium transition-colors"
            >
              <span>Back to Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-6 pt-5 border-t border-[#C3B4AA]/8 flex items-center justify-between text-xs">
          <Link
            href="/auth/login"
            className="flex items-center gap-1.5 text-[#988879] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Login</span>
          </Link>

          <Link
            href="/auth/signup"
            className="text-[#AD543C] hover:text-[#e0a08a] hover:underline"
          >
            Create new account
          </Link>
        </div>
      </div>
    </div>
  );
}
