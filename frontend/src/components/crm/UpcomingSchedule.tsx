"use client";
import React, { useState } from "react";
import Checkbox from "../form/input/Checkbox";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";

export default function UpcomingSchedule() {
  // Define the state with an index signature for dynamic string keys
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({
    "wed-11-jan": false,
    "fri-15-feb": false,
    "thu-18-mar": false,
  });

  const handleCheckboxChange = (id: string) => {
    setCheckedItems((prevState) => ({
      ...prevState,
      [id]: !prevState[id], // Toggle the checkbox state
    }));
  };

  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Upcoming Schedule
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

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[500px] xl:min-w-full">
          <div className="flex flex-col gap-2">
            {/* Item 1 */}
            <div className="flex cursor-pointer items-center gap-9 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-white/[0.03]">
              <div className="flex items-start gap-3">
                <div>
                  <Checkbox
                    className="w-5 h-5 rounded-md"
                    checked={checkedItems["wed-11-jan"]}
                    onChange={() => handleCheckboxChange("wed-11-jan")}
                  />
                </div>
                <div>
                  <span className="mb-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
                    Wed, 11 Jan
                  </span>
                  <span className="font-medium text-gray-700 text-theme-sm dark:text-gray-400">
                    09:20 AM
                  </span>
                </div>
              </div>
              <div>
                <span className="block mb-1 font-medium text-gray-700 text-theme-sm dark:text-gray-400">
                  Business Analytics Press
                </span>
                <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                  Exploring the Future of Data-Driven +6 more
                </span>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex cursor-pointer items-center gap-9 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-white/[0.03]">
              <div className="flex items-start gap-3">
                <div>
                  <Checkbox
                    className="w-5 h-5 rounded-md"
                    checked={checkedItems["fri-15-feb"]}
                    onChange={() => handleCheckboxChange("fri-15-feb")}
                  />
                </div>
                <div>
                  <span className="mb-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
                    Fri, 15 Feb
                  </span>
                  <span className="font-medium text-gray-700 text-theme-sm dark:text-gray-400">
                    10:35 AM
                  </span>
                </div>
              </div>
              <div>
                <span className="block mb-1 font-medium text-gray-700 text-theme-sm dark:text-gray-400">
                  Business Sprint
                </span>
                <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                  Techniques from Business Sprint +2 more
                </span>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex cursor-pointer items-center gap-9 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-white/[0.03]">
              <div className="flex items-start gap-3">
                <div>
                  <Checkbox
                    className="w-5 h-5 rounded-md"
                    checked={checkedItems["thu-18-mar"]}
                    onChange={() => handleCheckboxChange("thu-18-mar")}
                  />
                </div>
                <div>
                  <span className="mb-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
                    Thu, 18 Mar
                  </span>
                  <span className="font-medium text-gray-700 text-theme-sm dark:text-gray-400">
                    1:15 AM
                  </span>
                </div>
              </div>
              <div>
                <span className="block mb-1 font-medium text-gray-700 text-theme-sm dark:text-gray-400">
                  Customer Review Meeting
                </span>
                <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                  Insights from the Customer Review Meeting +8 more
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
