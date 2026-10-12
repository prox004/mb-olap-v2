"use client";
import React, { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  AiIcon,
  BoxCubeIcon,
  CartIcon,
  GridIcon,
  ListIcon,
  PieChartIcon,
  TableIcon,
  TaskIcon,
  UserIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
  new?: boolean;
};

type NavGroup = {
  groupName: string;
  items: NavItem[];
};

import { useAuth } from "@/context/AuthContext";

const baseNavGroups: NavGroup[] = [
  {
    groupName: "Self-Service Reports",
    items: [
      { name: "Report Builder", icon: <TableIcon />, path: "/report-builder", new: true },
      { name: "Comparison", icon: <PieChartIcon />, path: "/comparison", new: true },
    ],
  },
  {
    groupName: "Overview & Hierarchy",
    items: [
      { name: "CEO Executive View", icon: <GridIcon />, path: "/" },
      { name: "Category Performance", icon: <PieChartIcon />, path: "/category-performance" },
    ],
  },
  {
    groupName: "Merchandise & Pricing",
    items: [
      { name: "Merchandise & SKUs", icon: <BoxCubeIcon />, path: "/merchandise-buying" },
      { name: "Size & Price Analytics", icon: <ListIcon />, path: "/size-price-analytics" },
      { name: "Colour Analytics", icon: <PieChartIcon />, path: "/colour-analytics" },
    ],
  },
  {
    groupName: "Supply Chain & Finance",
    items: [
      { name: "Store Allocation", icon: <TaskIcon />, path: "/store-allocation" },
      { name: "Financial & GMROI", icon: <TableIcon />, path: "/financial-gmroi" },
      { name: "Vendor Scorecard", icon: <CartIcon />, path: "/vendor-performance" },
    ],
  },
  {
    groupName: "AI & Intelligence",
    items: [
      { name: "AI Recommendations", icon: <AiIcon />, path: "/ai-recommendations" },
      { name: "Smart AI Assistant", icon: <AiIcon />, path: "/olap-assistant", new: true },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === "Manager";

  const olapNavGroups: NavGroup[] = [
    ...baseNavGroups,
    {
      groupName: isManager ? "Store & Team Administration" : "My Account",
      items: [
        {
          name: isManager ? "Settings & Team Setup" : "My Profile & Store",
          icon: <UserIcon />,
          path: "/profile",
        },
      ],
    },
  ];

  const {
    isExpanded,
    isMobileOpen,
    openGroups,
    toggleSidebar,
    toggleGroup,
    closeMobileSidebar,
  } = useSidebar();
  const pathname = usePathname();

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white z-50 flex flex-col transition-all duration-300 ease-in-out ${
        isExpanded || isMobileOpen ? "w-[280px]" : "w-[76px]"
      } ${
        isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      } xl:translate-x-0`}
      aria-label="Navigation Sidebar"
    >
      {/* 1. SIDEBAR HEADER */}
      {isExpanded || isMobileOpen ? (
        // Expanded Header: Full Logo Branding + Collapse Arrow
        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 shrink-0">
          <Link
            href="/"
            onClick={closeMobileSidebar}
            className="flex items-center gap-2.5 group min-w-0"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white font-bold text-lg shadow-xs group-hover:scale-105 transition-transform">
              MB
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold text-gray-900 dark:text-white leading-tight truncate">
                M Baazar Analytics
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Retail Intelligence</span>
            </div>
          </Link>

          <button
            onClick={toggleSidebar}
            title={isExpanded ? "Collapse to mini icons" : "Close"}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0 ml-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      ) : (
        // Mini Collapsed Header: Centered MB Icon
        <div className="h-16 flex items-center justify-center border-b border-gray-100 dark:border-gray-800 shrink-0">
          <button
            onClick={toggleSidebar}
            title="Expand Navigation (Click to open)"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white font-bold text-lg shadow-xs hover:scale-105 transition-transform cursor-pointer"
          >
            MB
          </button>
        </div>
      )}

      {/* 2. NAVIGATION ITEMS LIST */}
      <div className="flex-1 overflow-y-auto py-4 duration-300 ease-linear no-scrollbar">
        {isExpanded || isMobileOpen ? (
          // EXPANDED VIEW: Collapsible Dropdown / Accordion Groups
          <nav className="px-3 space-y-4">
            {olapNavGroups.map((group) => {
              const isGroupOpen = openGroups[group.groupName] ?? true;
              const hasActiveItem = group.items.some((item) => isActive(item.path));

              return (
                <div key={group.groupName} className="space-y-1">
                  {/* Parent Option Dropdown Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.groupName)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer select-none ${
                      hasActiveItem
                        ? "text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-800/60"
                    }`}
                  >
                    <span>{group.groupName}</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isGroupOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Sub-Category Options */}
                  {isGroupOpen && (
                    <ul className="flex flex-col gap-1 pl-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      {group.items.map((nav) => {
                        const active = isActive(nav.path);
                        return (
                          <li key={nav.name}>
                            <Link
                              href={nav.path}
                              onClick={closeMobileSidebar}
                              className={`menu-item group ${
                                active ? "menu-item-active" : "menu-item-inactive"
                              }`}
                            >
                              <span
                                className={`${
                                  active
                                    ? "menu-item-icon-active"
                                    : "menu-item-icon-inactive"
                                }`}
                              >
                                {nav.icon}
                              </span>
                              <span className="menu-item-text">{nav.name}</span>
                              {nav.new && (
                                <span className="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                                  NEW
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>
        ) : (
          // MINI ICON-ONLY VIEW: Visible Outside Without Opening Hamburger Menu
          <nav className="flex flex-col items-center px-2 space-y-2">
            {olapNavGroups.map((group, gIdx) => (
              <div key={group.groupName} className="w-full flex flex-col items-center space-y-2">
                {gIdx > 0 && (
                  <div className="w-8 border-t border-gray-200/60 dark:border-gray-800 my-1" />
                )}
                {group.items.map((nav) => {
                  const active = isActive(nav.path);
                  return (
                    <div key={nav.name} className="relative group/tooltip flex justify-center w-full">
                      <Link
                        href={nav.path}
                        className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all ${
                          active
                            ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30 scale-105"
                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span className="w-5 h-5 flex items-center justify-center">
                          {nav.icon}
                        </span>
                      </Link>

                      {/* Tooltip on Hover */}
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-gray-900 dark:bg-gray-800 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-99999 border border-gray-700">
                        <div className="font-semibold">{nav.name}</div>
                        <div className="text-[10px] text-gray-400 font-normal">{group.groupName}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        )}
      </div>

      {/* 3. SIDEBAR FOOTER */}
      <div className="border-t border-gray-100 dark:border-gray-800 shrink-0">
        {isExpanded || isMobileOpen ? (
          <div className="h-12 px-4 flex items-center justify-between text-[11px] text-gray-400">
            <span className="font-mono">v2.4.0 • System Ready</span>
            <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
        ) : (
          <div className="h-12 flex items-center justify-center">
            <span
              className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"
              title="Live Sync Active"
            ></span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
