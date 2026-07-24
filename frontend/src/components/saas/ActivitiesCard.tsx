"use client";

import { useState } from "react";
import { MoreDotIcon } from "../../icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import Image from "next/image";

export default function ActivitiesCard() {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Activities
          </h3>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
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
      <div className="relative">
        {/* <!-- Timeline line --> */}
        <div className="absolute top-6 bottom-10 left-5 w-px bg-gray-200 dark:bg-gray-800"></div>

        {/* <!-- Francisco Grbbs --> */}
        <div className="relative mb-6 flex">
          <div className="z-10 flex-shrink-0">
            <Image
              src="/images/user/user-01.jpg"
              alt="Francisco Grbbs"
              className="size-10 rounded-full object-cover ring-4 ring-white dark:ring-gray-800"
              width={40}
              height={40}
            />
          </div>
          <div className="ml-4">
            <div className="mb-1 flex items-center gap-1">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 5.0625H14.0625L12.5827 8.35084C12.4506 8.64443 12.4506 8.98057 12.5827 9.27416L14.0625 12.5625H10.125C9.50368 12.5625 9 12.0588 9 11.4375V10.875M3.9375 10.875H9M3.9375 3.375H7.875C8.49632 3.375 9 3.87868 9 4.5V10.875M3.9375 15.9375V2.0625"
                  stroke="#12B76A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-theme-xs text-success-500 font-medium">
                New invoice
              </p>
            </div>
            <div className="flex items-baseline">
              <h3 className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                Francisco Grbbs
              </h3>
              <span className="text-theme-sm ml-2 font-normal text-gray-500 dark:text-gray-400">
                created invoice
              </span>
            </div>
            <p className="text-theme-sm font-normal text-gray-500 dark:text-gray-400">
              PQ-4491C
            </p>
            <p className="text-theme-xs mt-1 text-gray-400">Just Now</p>
          </div>
        </div>

        {/* <!-- Courtney Henry --> */}
        <div className="relative mb-6 flex">
          <div className="z-10 flex-shrink-0">
            <Image
              src="/images/user/user-03.jpg"
              alt="Courtney Henry"
              className="size-10 rounded-full object-cover ring-4 ring-white dark:ring-gray-800"
              width={40}
              height={40}
            />
          </div>
          <div className="ml-4">
            <div className="flex items-baseline">
              <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                Courtney Henry
              </h3>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                created invoice
              </span>
            </div>
            <p className="text-theme-sm font-normal text-gray-500 dark:text-gray-400">
              HK-234G
            </p>
            <p className="text-theme-xs mt-1 text-gray-400">15 minutes ago</p>
          </div>
        </div>

        {/* <!-- Bessie Cooper --> */}
        <div className="relative mb-6 flex">
          <div className="z-10 flex-shrink-0">
            <Image
              src="/images/user/user-04.jpg"
              alt="Bessie Cooper"
              className="size-10 rounded-full object-cover ring-4 ring-white dark:ring-gray-800"
              width={40}
              height={40}
            />
          </div>
          <div className="ml-4">
            <div className="flex items-baseline">
              <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                Bessie Cooper
              </h3>
              <span className="text-theme-sm ml-2 text-gray-500 dark:text-gray-400">
                created invoice
              </span>
            </div>
            <p className="text-theme-sm font-normal text-gray-500 dark:text-gray-400">
              LH-2891C
            </p>
            <p className="text-theme-xs mt-1 text-gray-400">5 months ago</p>
          </div>
        </div>

        {/* <!-- Theresa Web --> */}
        <div className="relative flex">
          <div className="z-10 flex-shrink-0">
            <Image
              src="/images/user/user-05.jpg"
              alt="Theresa Web"
              className="size-10 rounded-full object-cover ring-4 ring-white dark:ring-gray-800"
              width={40}
              height={40}
            />
          </div>
          <div className="ml-4">
            <div className="flex items-baseline">
              <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                Theresa Web
              </h3>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                created invoice
              </span>
            </div>
            <p className="text-theme-sm font-normal text-gray-500 dark:text-gray-400">
              CK-125NH
            </p>
            <p className="text-theme-xs mt-1 text-gray-400">2 weeks ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}
