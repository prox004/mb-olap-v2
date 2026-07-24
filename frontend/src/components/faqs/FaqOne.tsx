import React from "react";
import { ChevronDownIcon } from "../../icons";

interface FaqOneProps {
  title: string;
  content: string;
  isOpen: boolean;
  toggleAccordion: () => void; // Function to toggle the open state
}

const FaqOne: React.FC<FaqOneProps> = ({
  title,
  content,
  isOpen,
  toggleAccordion,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Accordion Header */}
      <div
        onClick={toggleAccordion}
        className={`flex cursor-pointer items-center justify-between py-3 pl-6 pr-3 ${
          isOpen ? "bg-gray-50 dark:bg-white/[0.03]" : ""
        }`}
      >
        <h4 className="text-lg font-medium text-gray-800 dark:text-white/90">
          {title}
        </h4>
        <button
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 duration-200 transition-transform ease-linear dark:bg-white/[0.03] ${
            isOpen
              ? "text-gray-800 dark:text-white/90 rotate-180"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <ChevronDownIcon />
        </button>
      </div>

      {/* Accordion Content */}
      {isOpen && (
        <div className="px-6 py-7">
          <p className="text-base text-gray-500 dark:text-gray-400">
            {content}
          </p>
        </div>
      )}
    </div>
  );
};

export default FaqOne;
