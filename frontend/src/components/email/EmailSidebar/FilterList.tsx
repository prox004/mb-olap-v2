"use client";
import React, { useState } from "react";

export default function FilterList() {
  const [activeItem, setActiveItem] = useState("");

  const filterItems = [
    { name: "Starred", key: "starred", icon: StarredIcon },
    { name: "Important", key: "important", icon: InboxIcon },
  ];
  return (
    <ul className="flex flex-col gap-1">
      {filterItems.map((item) => (
        <li key={item.key}>
          <button
            onClick={() => setActiveItem(item.key)}
            className={`group flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium
              ${
                activeItem === item.key
                  ? "text-brand-500 bg-brand-50 dark:text-brand-400 dark:bg-brand-500/[0.12]"
                  : "text-gray-500 dark:text-gray-400"
              }
              hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/[0.12] dark:hover:text-brand-400`}
          >
            <span className="flex items-center gap-3">
              <item.icon />
              {item.name}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

const InboxIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.2996 1.12891C11.4713 1.12891 10.7998 1.80033 10.7996 2.62867L10.7996 3.1264V3.12659L10.7997 4.87507H6.14591C3.6031 4.87507 1.54175 6.93642 1.54175 9.47923V14.3207C1.54175 15.4553 2.46151 16.3751 3.5961 16.3751H6.14591H10.0001H16.2084C17.4511 16.3751 18.4584 15.3677 18.4584 14.1251V10.1251C18.4584 7.22557 16.1079 4.87507 13.2084 4.87507H12.2997L12.2996 3.87651H13.7511C14.5097 3.87651 15.1248 3.26157 15.1249 2.50293C15.125 1.74411 14.5099 1.12891 13.7511 1.12891H12.2996ZM3.04175 9.47923C3.04175 7.76485 4.43153 6.37507 6.14591 6.37507C7.8603 6.37507 9.25008 7.76485 9.25008 9.47923V14.8751H6.14591H3.5961C3.28994 14.8751 3.04175 14.6269 3.04175 14.3207V9.47923ZM10.7501 9.47923V14.8751H16.2084C16.6226 14.8751 16.9584 14.5393 16.9584 14.1251V10.1251C16.9584 8.054 15.2795 6.37507 13.2084 6.37507H9.54632C10.294 7.19366 10.7501 8.28319 10.7501 9.47923Z"
      fill="currentColor"
    />
  </svg>
);

const StarredIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.99993 2.375C10.2854 2.375 10.5461 2.53707 10.6725 2.79308L12.7318 6.96563L17.3365 7.63473C17.619 7.67578 17.8537 7.87367 17.9419 8.14517C18.0301 8.41668 17.9565 8.71473 17.7521 8.914L14.4201 12.1619L15.2067 16.748C15.255 17.0293 15.1393 17.3137 14.9083 17.4815C14.6774 17.6493 14.3712 17.6714 14.1185 17.5386L9.99993 15.3733L5.88137 17.5386C5.62869 17.6714 5.32249 17.6493 5.09153 17.4815C4.86057 17.3137 4.7449 17.0293 4.79316 16.748L5.57974 12.1619L2.24775 8.914C2.04332 8.71473 1.96975 8.41668 2.05797 8.14517C2.14619 7.87367 2.3809 7.67578 2.66341 7.63473L7.2681 6.96563L9.32738 2.79308C9.45373 2.53707 9.71445 2.375 9.99993 2.375ZM9.99993 4.81966L8.4387 7.98306C8.32946 8.20442 8.11828 8.35785 7.874 8.39334L4.38298 8.90062L6.90911 11.363C7.08587 11.5353 7.16653 11.7835 7.1248 12.0268L6.52847 15.5037L9.65093 13.8622C9.86942 13.7473 10.1304 13.7473 10.3489 13.8622L13.4714 15.5037L12.8751 12.0268C12.8333 11.7835 12.914 11.5353 13.0908 11.363L15.6169 8.90062L12.1259 8.39334C11.8816 8.35785 11.6704 8.20442 11.5612 7.98306L9.99993 4.81966Z"
      fill="currentColor"
    />
  </svg>
);
