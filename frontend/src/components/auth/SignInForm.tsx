"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { useAuth } from "@/context/AuthContext";
import { useOlapFilter } from "@/context/OlapFilterContext";

export default function SignInForm() {
  const { loginAsManager, loginAsStaff, registerAndLoginStaff } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"Manager" | "Staff">("Manager");
  const [staffMode, setStaffMode] = useState<"signin" | "register">("signin");

  // Staff Credentials Sign In Form State
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Staff Registration Form State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regStore, setRegStore] = useState("All Outlets");

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleManagerLogin = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await loginAsManager();
      if (!res.success) {
        setErrorMessage(res.message || "Failed to log in as Manager.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error logging in as Manager.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffEmail.trim() || !staffPassword.trim()) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await loginAsStaff(staffEmail, staffPassword);
      if (!res.success) {
        setErrorMessage(
          res.message ||
            "Invalid credentials. Please contact your Store Manager or register below."
        );
      } else {
        setSuccessMessage("Sign in successful! Redirecting to dashboard...");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error logging in as Staff.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStaffRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMessage("Please fill in Name, Email, and Password to register.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await registerAndLoginStaff({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword.trim(),
        store: regStore,
      });

      if (!res.success) {
        setErrorMessage(res.message || "Failed to register staff account.");
      } else {
        setSuccessMessage("Account created successfully! Entering dashboard...");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error registering staff account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full p-4 sm:p-8">
      {/* Back link */}
      <div className="w-full max-w-md mx-auto mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Dashboard Overview
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          {/* Header */}
          <div className="mb-6 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
              M Baazar Retail Workspace
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Sign In to Your Workspace
            </h1>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Select your role to sign in or register before starting the dashboard.
            </p>
          </div>

          {/* Role Selector Tabs (Manager vs Staff) */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
              {/* Manager Tab */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("Manager");
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  selectedRole === "Manager"
                    ? "bg-white dark:bg-gray-900 text-brand-600 dark:text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Manager
              </button>

              {/* Staff Tab */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("Staff");
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  selectedRole === "Staff"
                    ? "bg-white dark:bg-gray-900 text-brand-600 dark:text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Staff
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <svg
                className="w-4 h-4 text-rose-500 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
              <svg
                className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. MANAGER TAB */}
          {selectedRole === "Manager" && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/40 text-xs text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2 font-bold text-brand-700 dark:text-brand-300 mb-1">
                  <span className="flex h-2 w-2 rounded-full bg-brand-500"></span>
                  Store Manager Sign In
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  Welcome, Manager. Click below to open your store sales, inventory, and staff management workspace.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Account Role</div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-white">
                    Operations Manager
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Active
                </span>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleManagerLogin}
                className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs tracking-wide shadow-sm shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in as Manager...
                  </>
                ) : (
                  <>
                    <span>Sign In as Manager</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 2. STAFF TAB */}
          {selectedRole === "Staff" && (
            <div className="space-y-4">
              {/* Staff Mode Toggle: Sign In vs Register */}
              <div className="flex border-b border-gray-100 dark:border-gray-800 pb-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setStaffMode("signin");
                    setErrorMessage(null);
                  }}
                  className={`text-xs font-bold pb-1 transition-colors border-b-2 ${
                    staffMode === "signin"
                      ? "border-brand-500 text-brand-600 dark:text-brand-400"
                      : "border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Staff Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStaffMode("register");
                    setErrorMessage(null);
                  }}
                  className={`text-xs font-bold pb-1 transition-colors border-b-2 ${
                    staffMode === "register"
                      ? "border-brand-500 text-brand-600 dark:text-brand-400"
                      : "border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Register New Staff
                </button>
              </div>

              {/* Staff Mode A: Sign In */}
              {staffMode === "signin" && (
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300">
                    Sign in with your assigned staff email &amp; password.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Staff Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="e.g. rahul.staff@mbaazar.in"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Staff Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        {showPassword ? <EyeIcon className="w-4 h-4" /> : <EyeCloseIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs tracking-wide shadow-sm shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? "Verifying..." : "Sign In as Staff"}
                  </button>
                </form>
              )}

              {/* Staff Mode B: Register */}
              {staffMode === "register" && (
                <form onSubmit={handleStaffRegister} className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-[11px] text-blue-800 dark:text-blue-300">
                    Register a new staff member account. Once submitted, you can immediately access the dashboard.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Suman Dey"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. suman.staff@mbaazar.in"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create login password"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Assigned Store Outlet
                    </label>
                    <input
                      type="text"
                      value={regStore}
                      onChange={(e) => setRegStore(e.target.value)}
                      placeholder="e.g. M Baazar - Howrah (#820) or All Outlets"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs tracking-wide shadow-sm shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? "Registering Account..." : "Register & Enter Dashboard"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Quick Info Footer */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-[11px] text-gray-400">
              Need assistance? Contact Retail Operations Admin at{" "}
              <span className="font-semibold text-brand-500">admin@mbaazar.in</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
