"use client";

import React, { useState } from "react";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import AdminOverviewTab from "@/components/admin/AdminOverviewTab";
import AdminStoresTab from "@/components/admin/AdminStoresTab";
import AdminPipelinesTab from "@/components/admin/AdminPipelinesTab";
import AdminConfigTab from "@/components/admin/AdminConfigTab";

type AdminTabKey = "overview" | "stores" | "pipelines" | "config";

export default function Profile() {
  const [activeTab, setActiveTab] = useState<AdminTabKey>("overview");

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "stores", label: "Stores (Add / Modify / Delete)" },
    { key: "pipelines", label: "ETL Pipelines & Parquet" },
    { key: "config", label: "System Config" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          Enterprise Admin & Outlet Management
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Scalable store outlet management (up to 250+ stores), automated Parquet storage, and background ETL pipeline controls.
        </p>
      </div>

      <UserMetaCard />

      {/* Modular Navigation Tabs */}
      <div>
        <div className="p-2 bg-white dark:bg-gray-900 border border-gray-200 rounded-t-2xl dark:border-gray-800 shadow-xs">
          <nav className="flex overflow-x-auto gap-2 rounded-xl bg-gray-100/80 p-1.5 dark:bg-gray-800/80">
            {tabs.map((tab) => (
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
          {activeTab === "pipelines" && <AdminPipelinesTab />}
          {activeTab === "config" && <AdminConfigTab />}
        </div>
      </div>
    </div>
  );
}

