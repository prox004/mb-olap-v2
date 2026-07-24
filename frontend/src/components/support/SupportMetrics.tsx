import React from "react";

export default function SupportMetrics() {
  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      <article className="flex gap-5 rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="bg-brand-500/10 text-brand-500 inline-flex h-14 w-14 items-center justify-center rounded-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
          >
            <path
              d="M4.95833 6.125C3.99183 6.125 3.20833 6.9085 3.20833 7.875V11.2998C4.69996 11.2998 5.9098 12.509 5.9098 14.0006C5.9098 15.4923 4.7006 16.7015 3.20897 16.7015L3.20833 20.125C3.20833 21.0915 3.99183 21.875 4.95833 21.875H23.0417C24.0082 21.875 24.7917 21.0915 24.7917 20.125V16.7015C23.3003 16.7011 22.0915 15.4921 22.0915 14.0006C22.0915 12.5092 23.3003 11.3001 24.7917 11.2998V7.875C24.7917 6.9085 24.0082 6.125 23.0417 6.125H4.95833Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-title-xs mb-1 font-semibold text-gray-800 dark:text-white/90">
            5,347
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total tickets
          </p>
        </div>
      </article>
      <article className="flex gap-5 rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="bg-warning-500/10 text-warning-500 inline-flex h-14 w-14 items-center justify-center rounded-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="29"
            height="28"
            viewBox="0 0 29 28"
            fill="none"
          >
            <path
              d="M5.33333 4.66675H24M5.33333 23.3334L24 23.3334M21.6667 4.66675V7.0001C21.6667 10.8661 18.5327 14.0001 14.6667 14.0001M7.66666 4.66675V7.0001C7.66666 10.8661 10.8007 14.0001 14.6667 14.0001M14.6667 14.0001C18.5327 14.0001 21.6667 17.1341 21.6667 21.0001V23.3334M14.6667 14.0001C10.8007 14.0001 7.66666 17.1341 7.66666 21.0001L7.66666 23.3334"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-title-xs mb-1 font-semibold text-gray-800 dark:text-white/90">
            1,230
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pending tickets
          </p>
        </div>
      </article>
      <article className="flex gap-5 rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="bg-success-500/10 text-success-500 inline-flex h-14 w-14 items-center justify-center rounded-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="29"
            height="28"
            viewBox="0 0 29 28"
            fill="none"
          >
            <path
              d="M17.8062 11.6598L13.1257 16.3403L10.8605 14.0751M25.125 13.9999C25.125 19.96 20.2934 24.7916 14.3334 24.7916C8.37328 24.7916 3.54169 19.96 3.54169 13.9999C3.54169 8.03985 8.37328 3.20825 14.3334 3.20825C20.2934 3.20825 25.125 8.03985 25.125 13.9999Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-title-xs mb-1 font-semibold text-gray-800 dark:text-white/90">
            4,117
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solved tickets
          </p>
        </div>
      </article>
    </div>
  );
}
