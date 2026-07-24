"use client";
import React, { useState } from "react";

export default function LabelList() {
  const [activeItem, setActiveItem] = useState("");

  const labelItems = [
    { name: "Personal", key: "personal", count: "", icon: PersonalLabel },
    { name: "Work", key: "work", icon: WorkLabel },
    { name: "Payments", key: "draft", icon: PaymentsLabel },
    { name: "Invoices", key: "invoices", icon: InvoicesLabel },
    { name: "Blank", key: "blank", icon: BlankLabel },
  ];
  return (
    <ul className="flex flex-col gap-1">
      {labelItems.map((item) => (
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
            {item.count && <span>{item.count}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

const PersonalLabel = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.7567 3.89683C11.6331 3.72282 11.4696 3.58089 11.28 3.48289C11.0904 3.3849 10.8801 3.33367 10.6667 3.3335L3.33333 3.34016C2.59667 3.34016 2 3.93016 2 4.66683V11.3335C2 12.0702 2.59667 12.6602 3.33333 12.6602L10.6667 12.6668C11.1167 12.6668 11.5133 12.4435 11.7567 12.1035L14.6667 8.00016L11.7567 3.89683Z"
      fill="#12B76A"
    />
  </svg>
);

const WorkLabel = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.7567 3.89683C11.6331 3.72282 11.4696 3.58089 11.28 3.48289C11.0904 3.3849 10.8801 3.33367 10.6667 3.3335L3.33333 3.34016C2.59667 3.34016 2 3.93016 2 4.66683V11.3335C2 12.0702 2.59667 12.6602 3.33333 12.6602L10.6667 12.6668C11.1167 12.6668 11.5133 12.4435 11.7567 12.1035L14.6667 8.00016L11.7567 3.89683Z"
      fill="#F04438"
    />
  </svg>
);

const PaymentsLabel = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.7567 3.89683C11.6331 3.72282 11.4696 3.58089 11.28 3.48289C11.0904 3.3849 10.8801 3.33367 10.6667 3.3335L3.33333 3.34016C2.59667 3.34016 2 3.93016 2 4.66683V11.3335C2 12.0702 2.59667 12.6602 3.33333 12.6602L10.6667 12.6668C11.1167 12.6668 11.5133 12.4435 11.7567 12.1035L14.6667 8.00016L11.7567 3.89683Z"
      fill="#FD853A"
    />
  </svg>
);

const InvoicesLabel = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.7567 3.89683C11.6331 3.72282 11.4696 3.58089 11.28 3.48289C11.0904 3.3849 10.8801 3.33367 10.6667 3.3335L3.33333 3.34016C2.59667 3.34016 2 3.93016 2 4.66683V11.3335C2 12.0702 2.59667 12.6602 3.33333 12.6602L10.6667 12.6668C11.1167 12.6668 11.5133 12.4435 11.7567 12.1035L14.6667 8.00016L11.7567 3.89683Z"
      fill="#36BFFA"
    />
  </svg>
);

const BlankLabel = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.7567 3.89683C11.6331 3.72282 11.4696 3.58089 11.28 3.48289C11.0904 3.3849 10.8801 3.33367 10.6667 3.3335L3.33333 3.34016C2.59667 3.34016 2 3.93016 2 4.66683V11.3335C2 12.0702 2.59667 12.6602 3.33333 12.6602L10.6667 12.6668C11.1167 12.6668 11.5133 12.4435 11.7567 12.1035L14.6667 8.00016L11.7567 3.89683Z"
      fill="#6172F3"
    />
  </svg>
);
