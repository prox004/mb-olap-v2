"use client";
import React, { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "../../icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";
import Image from "next/image";

type WatchlistItemProps = {
  symbol: string;
  companyName: string;
  price: string;
  change: string;
  changeDirection: "up" | "down"; // Determines icon and color
  brandImage: string; // Path to the brand image
};

const watchlistData: WatchlistItemProps[] = [
  {
    symbol: "AAPL",
    companyName: "Apple, Inc",
    price: "$4,008.65",
    change: "11.01%",
    changeDirection: "up",
    brandImage: "./images/brand/brand-07.svg",
  },
  {
    symbol: "SPOT",
    companyName: "Spotify.com",
    price: "$11,689.00",
    change: "9.48%",
    changeDirection: "up",
    brandImage: "./images/brand/brand-11.svg",
  },
  {
    symbol: "ABNB",
    companyName: "Airbnb, Inc",
    price: "$32,227.00",
    change: "0.29%",
    changeDirection: "down",
    brandImage: "./images/brand/brand-12.svg",
  },
  {
    symbol: "ENVT",
    companyName: "Envato, Inc",
    price: "$13,895.00",
    change: "3.79%",
    changeDirection: "up",
    brandImage: "./images/brand/brand-13.svg",
  },
  {
    symbol: "QIWI",
    companyName: "qiwi.com, Inc",
    price: "$4,008.65",
    change: "4.52%",
    changeDirection: "down",
    brandImage: "./images/brand/brand-14.svg",
  },
  {
    symbol: "APPL",
    companyName: "Apple, Inc",
    price: "$4,523.00",
    change: "3.12%",
    changeDirection: "up",
    brandImage: "./images/brand/brand-07.svg",
  },
  {
    symbol: "SPOT",
    companyName: "Spotify.com",
    price: "$11,689.00",
    change: "9.48%",
    changeDirection: "up",
    brandImage: "./images/brand/brand-11.svg",
  },
  {
    symbol: "ABNB",
    companyName: "Airbnb, Inc",
    price: "$32,227.00",
    change: "0.29%",
    changeDirection: "down",
    brandImage: "./images/brand/brand-12.svg",
  },
];

const WatchlistItem: React.FC<WatchlistItemProps> = ({
  symbol,
  companyName,
  price,
  change,
  changeDirection,
  brandImage,
}) => {
  return (
    <div className="flex items-center justify-between pt-4 pb-4 border-b border-gray-200 first:pt-0 last:border-b-0 last:pb-0 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10">
          <Image width={40} height={40} src={brandImage} alt={companyName} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {symbol}
          </h3>
          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
            {companyName}
          </span>
        </div>
      </div>
      <div>
        <h4 className="mb-1 font-medium text-right text-gray-700 text-theme-sm dark:text-gray-400">
          {price}
        </h4>
        <span
          className={`flex items-center justify-end gap-1 font-medium text-theme-xs ${
            changeDirection === "up"
              ? "text-success-600 dark:text-success-500"
              : "text-error-600 dark:text-error-500"
          }`}
        >
          {changeDirection === "up" ? <ArrowUpIcon /> : <ArrowDownIcon />}
          {change}
        </span>
      </div>
    </div>
  );
};

export default function WatchList() {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          My Watchlist
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

      <div className="flex h-[372px] flex-col">
        <div className="flex flex-col h-auto pr-3 overflow-y-auto custom-scrollbar">
          {watchlistData.map((item, i) => (
            <WatchlistItem key={i + 1} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}
