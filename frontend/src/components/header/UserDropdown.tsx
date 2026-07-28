"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { AiIcon, UserIcon } from "@/icons";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center dropdown-toggle text-gray-700 dark:text-gray-400"
      >
        <span className="mr-3 overflow-hidden rounded-full h-10 w-10 border border-gray-200 dark:border-gray-700">
          <Image
            width={40}
            height={40}
            src="/images/user/owner.png"
            alt="User"
          />
        </span>

        <span className="block mr-1 font-semibold text-xs text-gray-900 dark:text-white">
          Retail Operations Admin
        </span>

        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
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
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark z-99999"
      >
        <div className="px-2 py-1.5 border-b border-gray-100 dark:border-gray-800">
          <span className="block font-bold text-xs text-gray-900 dark:text-white">
            MB-Analytics Operations Lead
          </span>
          <span className="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-400">
            admin@mbaazar.in
          </span>
        </div>

        <ul className="flex flex-col gap-1 pt-2 pb-2 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-xs text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
            >
              <UserIcon className="w-4 h-4 text-gray-500" />
              Profile & Store Setup
            </DropdownItem>
          </li>
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
        <Link
          href="/"
          onClick={closeDropdown}
          className="flex items-center justify-center gap-2 px-3 py-2 mt-2 font-semibold text-xs text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          Sign Out
        </Link>
      </Dropdown>
    </div>
  );
}
