"use client";
import React, { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";
import Image from "next/image";

export default function TrafficSource() {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Top Traffic Source
          </h3>
        </div>
        <div className="relative h-fit">
          <button onClick={toggleDropdown} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="items-center w-full rounded-full max-w-8">
              <Image
                width={32}
                height={32}
                className="w-full"
                src="/images/brand/brand-05.svg"
                alt="brand"
              />
            </div>
            <div>
              <p className="font-medium text-gray-700 text-theme-sm dark:text-gray-300">
                Google
              </p>
            </div>
          </div>

          <div className="flex w-full max-w-[140px] items-center gap-3">
            <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
              <div className="absolute left-0 top-0 flex h-full w-[79%] items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"></div>
            </div>
            <p className="font-medium text-gray-700 text-theme-sm dark:text-gray-400">
              79%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="items-center w-full rounded-full max-w-8">
              <Image
                width={32}
                height={32}
                src="/images/brand/brand-06.svg"
                alt="brand"
              />
            </div>
            <div>
              <p className="font-medium text-gray-700 text-theme-sm dark:text-gray-300">
                Youtube
              </p>
            </div>
          </div>

          <div className="flex w-full max-w-[140px] items-center gap-3">
            <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
              <div className="absolute left-0 top-0 flex h-full w-[55%] items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"></div>
            </div>
            <p className="font-medium text-gray-700 text-theme-sm dark:text-gray-400">
              55%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="items-center w-full rounded-full max-w-8">
              <Image
                width={32}
                height={32}
                src="/images/brand/brand-02.svg"
                alt="brand"
              />
            </div>
            <div>
              <p className="font-medium text-gray-700 text-theme-sm dark:text-gray-300">
                Facebook
              </p>
            </div>
          </div>

          <div className="flex w-full max-w-[140px] items-center gap-3">
            <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
              <div className="absolute left-0 top-0 flex h-full w-[48%] items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"></div>
            </div>
            <p className="font-medium text-gray-700 text-theme-sm dark:text-gray-400">
              48%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="items-center w-full rounded-full max-w-8">
              <Image
                width={32}
                height={32}
                src="/images/brand/brand-04.svg"
                alt="brand"
              />
            </div>
            <div>
              <p className="font-medium text-gray-700 text-theme-sm dark:text-gray-300">
                Instagram
              </p>
            </div>
          </div>

          <div className="flex w-full max-w-[140px] items-center gap-3">
            <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
              <div className="absolute left-0 top-0 flex h-full w-[48%] items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"></div>
            </div>
            <p className="font-medium text-gray-700 text-theme-sm dark:text-gray-400">
              48%
            </p>
          </div>
        </div>
      </div>

      <a
        href="#"
        className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white p-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
      >
        View All
      </a>
    </div>
  );
}
