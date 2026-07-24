"use client";
import React, { useState } from "react";
import { CheckLineIcon } from "../../icons";

const starterPack = [
  "5 website",
  "500 MB Storage",
  "Unlimited Sub-Domain",
  "3 Custom Domain",
  "Free SSL Certificate",
  "Unlimited Traffic",
];
const mediumPack = [
  "10 website",
  "1 GB Storage",
  "Unlimited Sub-Domain",
  "5 Custom Domain",
  "Free SSL Certificate",
  "Unlimited Traffic",
];
const largePack = [
  "15 website",
  "10 GB Storage",
  "Unlimited Sub-Domain",
  "10 Custom Domain",
  "Free SSL Certificate",
  "Unlimited Traffic",
];

export default function PriceTableOne() {
  const [isMonthly, setIsMonthly] = useState(true);
  return (
    <div>
      <div className="mx-auto w-full max-w-[385px]">
        <h2 className="font-bold text-center text-gray-800 mb-7 text-title-sm dark:text-white/90">
          Flexible Plans Tailored to Fit Your Unique Needs!
        </h2>
      </div>
      <div>
        <div className="mb-10 text-center">
          <div className="relative inline-flex p-1 mx-auto bg-gray-200 rounded-full z-1 dark:bg-gray-800">
            <span
              className={`absolute top-1/2 -z-1 flex h-11 w-[120px] -translate-y-1/2 rounded-full bg-white shadow-theme-xs duration-200 ease-linear dark:bg-white/10 ${
                isMonthly ? "translate-x-0" : "translate-x-full"
              }`}
            ></span>
            <button
              onClick={() => setIsMonthly(true)}
              className={`flex h-11 w-[120px] items-center justify-center text-base font-medium ${
                isMonthly
                  ? "text-gray-800 dark:text-white/90"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-white/70 dark:text-gray-400"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsMonthly(false)}
              className={`flex h-11 w-[120px] items-center justify-center text-base font-medium ${
                !isMonthly
                  ? "text-gray-800 dark:text-white/90"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-white/80 dark:text-gray-400"
              }`}
            >
              Annually
            </button>
          </div>
        </div>

        <div className="grid gap-5 gird-cols-1 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
          {/* <!-- Pricing item --> */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <span className="block mb-3 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
              Starter
            </span>

            <div className="flex items-center justify-between mb-1">
              <div className="flex items-end">
                <h2 className="font-bold text-gray-800 text-title-md dark:text-white/90">
                  ${isMonthly ? "5.00" : "40.00"}
                </h2>

                <span className="inline-block mb-1 text-sm text-gray-500 dark:text-gray-400">
                  /month
                </span>
              </div>
              <span className="font-semibold text-gray-400 line-through text-theme-xl">
                ${isMonthly ? "12.00" : "150.00"}
              </span>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              For solo designers & freelancers
            </p>

            <div className="w-full h-px my-6 bg-gray-200 dark:bg-gray-800"></div>

            <ul className="mb-8 space-y-3">
              {starterPack.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400"
                >
                  <CheckLineIcon className="text-success-500" />
                  {item}
                </li>
              ))}
            </ul>

            <button className="flex w-full items-center justify-center rounded-lg bg-gray-800 p-3.5 text-sm font-medium text-white shadow-theme-xs transition-colors hover:bg-brand-500 dark:bg-white/10 dark:hover:bg-brand-600">
              Choose Starter
            </button>
          </div>

          {/* <!-- Pricing item --> */}
          <div className="p-6 bg-gray-800 border border-gray-800 rounded-2xl dark:border-white/10 dark:bg-white/10">
            <span className="block mb-3 font-semibold text-white text-theme-xl">
              Medium
            </span>

            <div className="flex items-center justify-between mb-1">
              <div className="flex items-end">
                <h2 className="font-bold text-white text-title-md">
                  ${isMonthly ? "10.99" : "100.00"}
                </h2>

                <span className="inline-block mb-1 text-sm text-white/70">
                  /month{" "}
                </span>
              </div>

              <span className="font-semibold text-gray-300 line-through text-theme-xl">
                ${isMonthly ? "30.00" : "250.00"}
              </span>
            </div>

            <p className="text-sm text-white/70">
              For working on commercial projects
            </p>

            <div className="w-full h-px my-6 bg-white/20"></div>

            <div className="mb-8 space-y-3">
              {mediumPack.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-sm text-white/80"
                >
                  <CheckLineIcon className="text-success-500" />
                  {item}
                </li>
              ))}
            </div>
            <button className="flex w-full items-center justify-center rounded-lg bg-brand-500 p-3.5 text-sm font-medium text-white shadow-theme-xs transition-colors hover:bg-brand-600 dark:hover:bg-brand-600">
              Choose Starter
            </button>
          </div>

          {/* <!-- Pricing item --> */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <span className="block mb-3 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
              Large
            </span>

            <div className="flex items-center justify-between mb-1">
              <div className="flex items-end">
                <h2 className="font-bold text-gray-800 text-title-md dark:text-white/90">
                  ${isMonthly ? "15.00" : "190.00"}
                </h2>
                <span className="inline-block mb-1 text-sm text-gray-500 dark:text-gray-400">
                  /month
                </span>
              </div>
              <span className="font-semibold text-gray-400 line-through text-theme-xl">
                ${isMonthly ? "59.00" : "350.00"}
              </span>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              For teams larger than 5 members
            </p>

            <div className="w-full h-px my-6 bg-gray-200 dark:bg-gray-800"></div>

            <ul className="mb-8 space-y-3">
              {largePack.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400"
                >
                  <CheckLineIcon className="text-success-500" />
                  {item}
                </li>
              ))}
            </ul>
            <button className="flex w-full items-center justify-center rounded-lg bg-gray-800 p-3.5 text-sm font-medium text-white shadow-theme-xs transition-colors hover:bg-brand-500 dark:bg-white/10 dark:hover:bg-brand-600">
              Choose Starter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
