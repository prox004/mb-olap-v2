"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { GlobalSearchBar } from "@/components/common/GlobalSearchBar";
import { useSidebar } from "@/context/SidebarContext";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { toggleSidebar } = useSidebar();

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 flex w-full bg-white border-b border-gray-200 z-50 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between w-full px-4 py-2.5 sm:px-6">
        {/* Left Section: Hamburger Toggle, Logo, and Search Bar */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          {/* Universal Hamburger Toggle Button */}
          <button
            onClick={toggleSidebar}
            aria-label="Toggle Navigation Menu"
            title="Toggle Menu"
            className="flex items-center justify-center w-9 h-9 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo Branding */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
              MB
            </div>
            <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white tracking-tight hidden sm:inline-block">
              M Baazar Analytics
            </span>
          </Link>

          {/* Global Search Bar */}
          <div className="hidden md:block w-72 lg:w-96 ml-2">
            <GlobalSearchBar />
          </div>
        </div>

        {/* Right Section: Theme Toggle, Notifications & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggleButton />
          <NotificationDropdown />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
