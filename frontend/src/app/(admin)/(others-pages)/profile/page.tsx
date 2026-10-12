"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import AdminOverviewTab from "@/components/admin/AdminOverviewTab";
import AdminStoresTab from "@/components/admin/AdminStoresTab";
import AdminStaffTab from "@/components/admin/AdminStaffTab";
import StaffProfileTab from "@/components/user-profile/StaffProfileTab";
import { useAuth } from "@/context/AuthContext";

type AdminTabKey = "overview" | "stores" | "staff" | "profile";

function ProfileContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isManager = user?.role === "Manager";

  const defaultTab: AdminTabKey = isManager ? "overview" : "profile";
  const initialParam = searchParams.get("tab") as AdminTabKey;

  const [activeTab, setActiveTab] = useState<AdminTabKey>(
    initialParam || defaultTab
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab") as AdminTabKey;
    if (tabParam) {
      setActiveTab(tabParam);
    } else {
      setActiveTab(isManager ? "overview" : "profile");
    }
  }, [searchParams, isManager]);

  // Manager Tabs
  const managerTabs = [
    { key: "overview", label: "Overview" },
    { key: "stores", label: "Store Branches (Add / Edit / Remove)" },
    { key: "staff", label: "Staff Team (Add & Manage Staff)" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          {isManager ? "Store & Team Administration" : "My Staff Profile & Store"}
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isManager
            ? "Manage store branch locations, staff login access, and retail network overview."
            : "View your personal work details, assigned store branch, and operational permissions."}
        </p>
      </div>

      <UserMetaCard />

      {/* Conditional Rendering: Staff vs Manager */}
      {isManager ? (
        <div>
          {/* Manager Navigation Tabs */}
          <div className="p-2 bg-white dark:bg-gray-900 border border-gray-200 rounded-t-2xl dark:border-gray-800 shadow-xs">
            <nav className="flex overflow-x-auto gap-2 rounded-xl bg-gray-100/80 p-1.5 dark:bg-gray-800/80">
              {managerTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as AdminTabKey)}
                  className={`inline-flex items-center rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ease-in-out shrink-0 ${
                    activeTab === tab.key
                      ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-white"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6 border border-t-0 border-gray-200 rounded-b-2xl dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
            {activeTab === "overview" && <AdminOverviewTab onNavigateStores={() => setActiveTab("stores")} />}
            {activeTab === "stores" && <AdminStoresTab />}
            {activeTab === "staff" && <AdminStaffTab />}
          </div>
        </div>
      ) : (
        /* Staff Member View: Tailored personal profile without managerial controls */
        <StaffProfileTab />
      )}
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-gray-400">Loading settings...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
