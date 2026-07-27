import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "System Settings & Profile | MB-OLAP V2 Enterprise Platform",
  description: "Retail system metadata and profile configuration",
};

export default function Profile() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          System Profile & Outlet Configuration
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Central warehouse & retail store operational metadata settings.
        </p>
      </div>
      <UserMetaCard />
      <UserInfoCard />
    </div>
  );
}
