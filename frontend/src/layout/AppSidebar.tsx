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
  HorizontaLDots,
  ListIcon,
  PieChartIcon,
  TableIcon,
  TaskIcon,
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

// Organized Enterprise Navigation Groups
const olapNavGroups: NavGroup[] = [
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
  const { isExpanded, isHovered, isMobileOpen, toggleSidebar, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  return (
    <aside
      className={`fixed flex flex-col xl:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-full transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        xl:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Integrated Sidebar Brand Icon & Toggle Button */}
      <div
        className={`py-6 flex items-center ${!isExpanded && !isHovered ? "xl:justify-center" : "justify-between"
          }`}
      >
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
          title={isExpanded ? "Click icon to collapse sidebar" : "Click icon to expand sidebar"}
          aria-label="Toggle Sidebar Expansion"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white font-bold text-lg shadow-xs group-hover:scale-105 transition-transform">
            MB
          </div>
          {(isExpanded || isHovered || isMobileOpen) && (
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-gray-900 dark:text-white leading-none">
                M Baazar Analytics
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Navigation Group Blocks */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-6">
            {olapNavGroups.map((group) => (
              <div key={group.groupName}>
                <h2
                  className={`mb-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 flex leading-5 ${!isExpanded && !isHovered
                    ? "xl:justify-center"
                    : "justify-start"
                    }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    group.groupName
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>

                <ul className="flex flex-col gap-1">
                  {group.items.map((nav) => {
                    const active = isActive(nav.path);
                    return (
                      <li key={nav.name}>
                        <Link
                          href={nav.path}
                          className={`menu-item group ${active ? "menu-item-active" : "menu-item-inactive"
                            }`}
                        >
                          <span
                            className={`${active
                              ? "menu-item-icon-active"
                              : "menu-item-icon-inactive"
                              }`}
                          >
                            {nav.icon}
                          </span>
                          {(isExpanded || isHovered || isMobileOpen) && (
                            <span className="menu-item-text">{nav.name}</span>
                          )}
                          {nav.new && (isExpanded || isHovered || isMobileOpen) && (
                            <span className="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                              NEW
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
