"use client";
import { MoreDotIcon } from "@/icons";
import Image from "next/image";
import React, { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

export default function DeliveryVehicle() {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="space-y5 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Delivery Vehicles
          </h3>
          <p className="dark:text-gray-40 text-sm text-gray-500">
            Vehicles operating on the road
          </p>
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
      <div className="relative mt-5 flex justify-between">
        <div>
          <h3 className="mb-1 text-3xl font-medium text-gray-800 dark:text-white/90">
            29
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span className="text-success-600 font-medium">+3.85%</span>
            than last Week
          </p>
          <div className="mt-5 flex items-center gap-2">
            <div className="ring-success-500 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-inset">
              <div className="bg-success-500 h-2.5 w-2.5 rounded-full"></div>
            </div>
            <div>
              <span className="text-success-500 text-sm font-medium">
                On-route
              </span>
            </div>
          </div>
        </div>
        <div>
          <Image
            width={160}
            height={132}
            className="absolute -right-6 -bottom-2"
            src="/images/logistics/truck.png"
            alt=""
          />
        </div>
      </div>
    </div>
  );
}
