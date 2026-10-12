"use client";

import React, { useState } from "react";
import { useAuth, StaffAccount } from "@/context/AuthContext";
import { useOlapFilter } from "@/context/OlapFilterContext";

export default function AdminStaffTab() {
  const { user, staffAccounts, isLoadingStaff, createStaffAccount, deleteStaffAccount } = useAuth();
  const { availableStores } = useOlapFilter();

  // Search Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedStore, setSelectedStore] = useState("All Outlets");

  // Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [id: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isManager = user?.role === "Manager";

  const handleTogglePassword = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCredentials = (staff: StaffAccount) => {
    const text = `Staff Name: ${staff.name}\nEmail: ${staff.email}\nPassword: ${staff.password}\nStore: ${staff.store}`;
    navigator.clipboard.writeText(text);
    setCopiedId(staff.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setFeedback({ type: "error", message: "Please fill in all required fields (Name, Email, Password)." });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      const res = await createStaffAccount({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        store: selectedStore,
      });

      if (res.success) {
        setFeedback({ type: "success", message: res.message || "Staff member created successfully!" });
        setName("");
        setEmail("");
        setPassword("");
        setSelectedStore("All Outlets");
      } else {
        setFeedback({ type: "error", message: res.message || "Failed to create staff member." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "An error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async (staff: StaffAccount) => {
    if (!confirm(`Are you sure you want to delete access for ${staff.name} (${staff.email})?`)) {
      return;
    }

    try {
      setFeedback(null);
      const res = await deleteStaffAccount(staff.id);
      if (res.success) {
        setFeedback({ type: "success", message: `Account for ${staff.name} has been removed.` });
      } else {
        setFeedback({ type: "error", message: res.message || "Failed to delete account." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to delete account." });
    }
  };

  const filteredStaff = staffAccounts.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.store && s.store.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-brand-50 to-white dark:from-brand-950/30 dark:to-gray-900 border border-brand-100 dark:border-brand-900/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-white uppercase tracking-wider">
              Manager Administration
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Active User: <strong className="text-gray-900 dark:text-white">{user?.name}</strong>
            </span>
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Staff Team &amp; Login Accounts
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Add new retail staff members below. Staff can log in directly using their assigned work email and password.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center shadow-xs">
            <span className="block text-lg font-bold text-brand-600 dark:text-brand-400">
              {staffAccounts.length}
            </span>
            <span className="block text-[10px] font-medium text-gray-500 dark:text-gray-400">
              Team Members
            </span>
          </div>
        </div>
      </div>

      {/* Status Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. ADD NEW STAFF FORM (Manager Only) */}
      {isManager ? (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-600 dark:text-brand-400 text-xs font-bold">
                +
              </span>
              Add New Staff Account
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Enter the staff member details. Once saved, they can immediately use this email and password to log in.
            </p>
          </div>

          <form onSubmit={handleCreateStaff} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vikram Sen"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. vikram.staff@mbaazar.in"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Login Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. mbaazar2026"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Assigned Outlet / Store
              </label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="All Outlets">All Outlets</option>
                {availableStores.map((store) => (
                  <option key={store.admsite_code} value={store.name}>
                    {store.name} (#{store.admsite_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs tracking-wide shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>Saving Staff Account...</>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Staff Login
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
          Staff Account: You are currently signed in with Staff access. To add or delete staff accounts, sign in as <strong>Manager</strong>.
        </div>
      )}

      {/* 2. STAFF DIRECTORY TABLE */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Registered Staff Accounts
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              List of staff authorized to access the M Baazar analytics portal.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or store..."
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        {isLoadingStaff ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading staff accounts...</div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            {searchQuery ? "No staff members matched your search." : "No staff accounts created yet. Add one above."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Staff Member</th>
                  <th className="py-3 px-4 font-semibold">Work Email</th>
                  <th className="py-3 px-4 font-semibold">Password</th>
                  <th className="py-3 px-4 font-semibold">Store Branch</th>
                  <th className="py-3 px-4 font-semibold">Joined Date</th>
                  {isManager && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {filteredStaff.map((staff) => {
                  const isPassRevealed = showPasswords[staff.id];
                  const isCopied = copiedId === staff.id;

                  return (
                    <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-xs shrink-0">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {staff.name}
                            </div>
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                              Staff Role
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-gray-600 dark:text-gray-300">
                        {staff.email}
                      </td>

                      <td className="py-3 px-4">
                        {isManager ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                              {isPassRevealed ? staff.password : "••••••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleTogglePassword(staff.id)}
                              className="text-[11px] text-brand-500 hover:text-brand-600 font-medium"
                              title="Toggle password visibility"
                            >
                              {isPassRevealed ? "Hide" : "Show"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyCredentials(staff)}
                              className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                              title="Copy credentials for staff"
                            >
                              {isCopied ? "✓ Copied" : "Copy"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">••••••••</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          {staff.store || "All Outlets"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-gray-400 text-[11px]">
                        {staff.created_at || "Recent"}
                      </td>

                      {isManager && (
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(staff)}
                            className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
