"use client";

import React from "react";
import Image from "next/image";

export default function UserMetaCard() {
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
            <h4 className="mb-1 text-lg font-bold text-center text-gray-900 dark:text-white xl:text-left">
              Retail Operations & Merchandising Team
            </h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                MB-OLAP Enterprise Platform Lead
              </p>
              <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Kolkata Headquarters (Central Warehouse #1070 & 3 Outlets)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
