"use client";

import React from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function UserMetaCard() {
  const { user } = useAuth();

  const userName = user?.name || (user?.role === "Manager" ? "Retail Operations Manager" : "Staff Member");
  const userRole = user?.role === "Manager" ? "Operations Manager" : "Retail Store Staff";
  const userEmail = user?.email || (user?.role === "Manager" ? "manager@mbaazar.in" : "staff@mbaazar.in");
  const userStore = user?.store || (user?.role === "Manager" ? "All Outlets (Headquarters)" : "M Baazar Store Branch");

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 bg-white dark:bg-gray-900 shadow-xs">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 shrink-0">
            <Image
              width={80}
              height={80}
              src="/images/user/owner.png"
              alt="user"
            />
          </div>
          <div className="order-3 xl:order-2">
            <div className="flex items-center gap-2 mb-1 justify-center xl:justify-start">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                {userName}
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                {user?.role || "Manager"}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                {userRole} • {userEmail}
              </p>
              <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {userStore}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
