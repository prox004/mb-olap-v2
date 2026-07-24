import React from "react";

export default function EmailDetailsBottom() {
  return (
    <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#171f2f]">
      <div className="flex flex-wrap sm:flex-row flex-col gap-3">
        <button className="items-center  inline-flex justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
          <svg
            className="stroke-current"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.12501 2.2915L2.29167 8.12484L8.12501 13.9582V10.1467C12.7241 10.1467 16.5665 13.3864 17.4947 17.7082C17.6347 17.0564 17.7084 16.3799 17.7084 15.6863C17.7084 10.3936 13.4177 6.10295 8.12501 6.10295V2.2915Z"
              stroke=""
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Reply
        </button>
        <button className="items-center inline-flex justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
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
              d="M9.47571 3.2734C9.69021 3.0589 10.0128 2.99474 10.2931 3.11082C10.5733 3.22691 10.756 3.50039 10.756 3.80373V6.1504C15.0735 6.52995 18.4597 10.1551 18.4597 14.5712C18.4597 15.182 18.3947 15.7786 18.2712 16.354C18.1969 16.6996 17.8914 16.9465 17.5379 16.9465C17.1844 16.9465 16.8788 16.6996 16.8046 16.354C16.1823 13.4565 13.7537 11.2297 10.756 10.9082V13.182C10.756 13.4854 10.5733 13.7589 10.2931 13.875C10.0128 13.991 9.69021 13.9269 9.47571 13.7124L4.78655 9.02322C4.6459 8.88256 4.56688 8.6918 4.56688 8.49289C4.56688 8.29397 4.6459 8.10321 4.78655 7.96256L9.47571 3.2734ZM9.25604 6.86758V5.61439L6.37754 8.49289L9.25604 11.3714V10.1182C9.25604 9.70395 9.59183 9.36817 10.006 9.36817C12.7248 9.36817 15.1431 10.6513 16.6894 12.6448C15.854 9.7415 13.1781 7.61758 10.006 7.61758C9.59183 7.61758 9.25604 7.2818 9.25604 6.86758ZM5.93258 3.27338C6.22548 2.98049 6.70035 2.98049 6.99324 3.27338C7.28613 3.56628 7.28613 4.04115 6.99324 4.33404L3.36474 7.96254C3.07185 8.25543 3.07185 8.73031 3.36474 9.0232L6.99324 12.6517C7.28613 12.9446 7.28613 13.4195 6.99324 13.7124C6.70035 14.0052 6.22548 14.0052 5.93258 13.7124L2.30408 10.0839C1.42541 9.20518 1.42541 7.78056 2.30408 6.90188L5.93258 3.27338Z"
              fill=""
            />
          </svg>
          Reply all
        </button>
        <button className="items-center inline-flex justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
          <svg
            className="stroke-current"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.875 2.2915L17.7083 8.12484L11.875 13.9582V10.1467C7.2759 10.1467 3.43348 13.3864 2.50533 17.7082C2.36535 17.0564 2.29166 16.3799 2.29166 15.6863C2.29166 10.3936 6.58227 6.10295 11.875 6.10295V2.2915Z"
              stroke=""
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Forward
        </button>
      </div>
    </div>
  );
}
