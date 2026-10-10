"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { AiIcon, UserIcon } from "@/icons";
import { useAuth } from "@/context/AuthContext";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    closeDropdown();
    logout();
  };

  const displayName = user?.name || (user?.role === "Staff" ? "Staff Member" : "Retail Operations Admin");
  const displayRole = user?.role || "Manager";
  const displayEmail = user?.email || (displayRole === "Manager" ? "admin@mbaazar.in" : "staff@mbaazar.in");

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center dropdown-toggle text-gray-700 dark:text-gray-400 group"
      >
        <span className="mr-2.5 overflow-hidden rounded-full h-9 w-9 border border-gray-200 dark:border-gray-700 shrink-0">
          <Image
            width={36}
            height={36}
            src="/images/user/owner.png"
            alt="User"
          />
        </span>

        <div className="text-left mr-1 hidden sm:block">
          <span className="block font-semibold text-xs text-gray-900 dark:text-white leading-tight">
            {displayName}
          </span>
          <span className="block text-[10px] text-gray-400 dark:text-gray-500 font-medium">
            {displayRole}
          </span>
        </div>

        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="16"
          height="16"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[270px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark z-99999"
      >
        <div className="px-2 py-2 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between gap-2">
            <span className="block font-bold text-xs text-gray-900 dark:text-white truncate">
              {displayName}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 border border-brand-200 dark:border-brand-800 shrink-0">
              {displayRole}
            </span>
          </div>
          <span className="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-400 truncate">
            {displayEmail}
          </span>
        </div>

        <ul className="flex flex-col gap-1 pt-2 pb-2 border-b border-gray-200 dark:border-gray-800">
          {displayRole === "Manager" ? (
            <>
              <li>
                <DropdownItem
                  onItemClick={closeDropdown}
                  tag="a"
                  href="/profile?tab=staff"
                  className="flex items-center gap-3 px-3 py-2 font-medium text-xs text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Staff Team Management
                </DropdownItem>
              </li>
              <li>
                <DropdownItem
                  onItemClick={closeDropdown}
                  tag="a"
                  href="/profile?tab=stores"
                  className="flex items-center gap-3 px-3 py-2 font-medium text-xs text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  Store Branches &amp; Outlets
                </DropdownItem>
              </li>
            </>
          ) : (
            <li>
              <DropdownItem
                onItemClick={closeDropdown}
                tag="a"
                href="/profile?tab=profile"
                className="flex items-center gap-3 px-3 py-2 font-medium text-xs text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              >
                <UserIcon className="w-4 h-4 text-brand-500" />
                My Profile &amp; Store Details
              </DropdownItem>
            </li>
          )}
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/olap-assistant"
              className="flex items-center gap-3 px-3 py-2 font-medium text-xs text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
            >
              <AiIcon className="w-4 h-4 text-brand-500" />
              AI Assistant Chat
            </DropdownItem>
          </li>
        </ul>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 font-semibold text-xs text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </Dropdown>
    </div>
  );
}
