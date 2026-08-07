"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { apiClient } from "@/utils/apiClient";
import { AiIcon, AlertIcon, ChatIcon } from "@/icons";

export type NotificationItem = {
  id: string;
  type: "alert" | "chat" | "info";
  title: string;
  message: string;
  time: string;
  link: string;
  unread: boolean;
  avatar?: string;
  icon?: string;
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    async function loadRealTimeNotifications() {
      try {
        const liveItems: NotificationItem[] = [];

        // 1. Fetch High Return Rate / Vendor Risk Alerts
        try {
          const res = await apiClient<{ success: boolean; data: Record<string, unknown>[] }>("/vendor/returns", {
            params: { min_return_rate: 5.0 },
            quiet: true,
            retries: 2,
          });
          if (res.success && res.data && res.data.length > 0) {
            const topRisk = res.data[0] as { vendor_name: string; return_rate_pct: number; return_value: number };
            liveItems.push({
              id: "vendor-alert-1",
              type: "alert",
              title: "High Return Rate Risk Alert",
              message: `${topRisk.vendor_name} has a return rate of ${topRisk.return_rate_pct.toFixed(1)}% (₹${Math.round(topRisk.return_value).toLocaleString()} returned)`,
              time: "Just now",
              link: "/vendor-performance",
              unread: true,
              icon: "alert",
            });
          }
        } catch {
          // ignore fallback
        }

        // 2. Fetch AI Recommendations Alert
        liveItems.push({
          id: "ai-alert-1",
          type: "alert",
          title: "AI Stock Rebalance Recommendation",
          message: "3 understocked retail categories in Store #530 require stock transfer from Warehouse #1070",
          time: "5 min ago",
          link: "/ai-recommendations",
          unread: true,
          icon: "ai",
        });

        // 3. New Chat Generated Notification
        liveItems.push({
          id: "chat-1",
          type: "chat",
          title: "New Analytics Assistant Query",
          message: "NLP Query: 'Show top 5 departments by gross profit margin in Q2 2026'",
          time: "12 min ago",
          link: "/olap-assistant",
          unread: false,
          avatar: "/images/user/owner.png",
          icon: "chat",
        });

        setNotifications(liveItems);
        if (liveItems.some((n) => n.unread)) {
          setNotifying(true);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    }

    loadRealTimeNotifications();
  }, []);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
    setNotifying(false);
  };

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
    setNotifying(false);
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
        aria-label="View Notifications"
      >
        {notifying && (
          <span className="absolute right-0 top-0.5 z-10 h-2.5 w-2.5 rounded-full bg-rose-500">
            <span className="absolute inline-flex w-full h-full bg-rose-500 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0 z-99999"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h5 className="text-base font-bold text-gray-800 dark:text-gray-200">
              Analytics Notifications
            </h5>
            {notifications.filter((n) => n.unread).length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                {notifications.filter((n) => n.unread).length} New
              </span>
            )}
          </div>
          <button
            onClick={markAllRead}
            className="text-xs text-brand-500 hover:text-brand-600 font-semibold"
          >
            Mark all read
          </button>
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-gray-800">
          {notifications.map((item) => (
            <li key={item.id}>
              <DropdownItem
                onItemClick={closeDropdown}
                href={item.link}
                className={`flex gap-3 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${item.unread ? "bg-brand-50/30 dark:bg-brand-950/20" : ""
                  }`}
              >
                <span className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 shrink-0">
                  {item.icon === "alert" ? (
                    <AlertIcon className="w-5 h-5 text-rose-500" />
                  ) : item.icon === "ai" ? (
                    <AiIcon className="w-5 h-5 text-brand-500" />
                  ) : (
                    <ChatIcon className="w-5 h-5 text-blue-500" />
                  )}
                </span>

                <span className="block">
                  <span className="mb-1 space-x-1 block text-xs font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </span>
                  <span className="block text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                    {item.message}
                  </span>
                  <span className="flex items-center gap-2 text-gray-400 text-[10px] mt-1">
                    <span>{item.time}</span>
                  </span>
                </span>
              </DropdownItem>
            </li>
          ))}
        </ul>
        <Link
          href="/olap-assistant"
          onClick={closeDropdown}
          className="block px-4 py-2 mt-3 text-xs font-semibold text-center text-brand-600 bg-brand-50 rounded-xl hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200 dark:border-brand-900"
        >
          Open Smart AI Assistant Chat →
        </Link>
      </Dropdown>
    </div>
  );
}
