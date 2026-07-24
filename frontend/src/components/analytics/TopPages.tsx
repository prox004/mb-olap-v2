"use client";
import React, { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";

export default function TopPages() {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Top Pages
        </h3>
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

      <div className="my-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-400 text-theme-xs"> Source </span>
          <span className="text-right text-gray-400 text-theme-xs">
            {" "}
            Pageview{" "}
          </span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 text-theme-sm dark:text-gray-400">
            tailadmin.com
          </span>
          <span className="text-right text-gray-500 text-theme-sm dark:text-gray-400">
            4.7K
          </span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 text-theme-sm dark:text-gray-400">
            preview.tailadmin.com
          </span>
          <span className="text-right text-gray-500 text-theme-sm dark:text-gray-400">
            3.4K
          </span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 text-theme-sm dark:text-gray-400">
            docs.tailadmin.com
          </span>
          <span className="text-right text-gray-500 text-theme-sm dark:text-gray-400">
            2.9K
          </span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 text-theme-sm dark:text-gray-400">
            tailadmin.com/componetns
          </span>
          <span className="text-right text-gray-500 text-theme-sm dark:text-gray-400">
            1.5K
          </span>
        </div>
      </div>

      <a
        href="#"
        className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white p-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
      >
        Channels Report
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M17.4175 9.9986C17.4178 10.1909 17.3446 10.3832 17.198 10.53L12.2013 15.5301C11.9085 15.8231 11.4337 15.8233 11.1407 15.5305C10.8477 15.2377 10.8475 14.7629 11.1403 14.4699L14.8604 10.7472L3.33301 10.7472C2.91879 10.7472 2.58301 10.4114 2.58301 9.99715C2.58301 9.58294 2.91879 9.24715 3.33301 9.24715L14.8549 9.24715L11.1403 5.53016C10.8475 5.23717 10.8477 4.7623 11.1407 4.4695C11.4336 4.1767 11.9085 4.17685 12.2013 4.46984L17.1588 9.43049C17.3173 9.568 17.4175 9.77087 17.4175 9.99715C17.4175 9.99763 17.4175 9.99812 17.4175 9.9986Z"
            fill=""
          />
        </svg>
      </a>
    </div>
  );
}
