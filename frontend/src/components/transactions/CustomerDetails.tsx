import React from "react";

export default function CustomerDetails() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
      <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
        Customer Details
      </h2>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        <li className="flex items-start gap-5 py-2.5">
          <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
            Name
          </span>
          <span className="w-1/2 text-sm text-gray-700 sm:w-2/3 dark:text-gray-400">
            Mushafrof Chowdhury
          </span>
        </li>
        <li className="flex items-start gap-5 py-2.5">
          <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
            Email
          </span>
          <span className="w-1/2 text-sm text-gray-700 sm:w-2/3 dark:text-gray-400">
            name@example.com
          </span>
        </li>
        <li className="flex items-start gap-5 py-2.5">
          <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
            Phone
          </span>
          <span className="w-1/2 text-sm text-gray-700 sm:w-2/3 dark:text-gray-400">
            Mountain View, CA, 94040
          </span>
        </li>
        <li className="flex items-start gap-5 py-2.5">
          <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
            Phone
          </span>
          <span className="w-1/2 text-sm text-gray-700 sm:w-2/3 dark:text-gray-400">
            +123 456 7890
          </span>
        </li>
        <li className="flex items-start gap-5 py-2.5">
          <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
            Country
          </span>
          <span className="w-1/2 text-sm text-gray-700 sm:w-2/3 dark:text-gray-400">
            United States
          </span>
        </li>
        <li className="flex items-start gap-5 py-2.5">
          <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
            Address
          </span>
          <span className="w-1/2 text-sm text-gray-700 sm:w-2/3 dark:text-gray-400">
            62 Miles Drive St, Newark, NJ 07103, California.
          </span>
        </li>
      </ul>
    </div>
  );
}
