"use client";
import Image from "next/image";
import { useState } from "react";

export default function TicketReplyContent() {
  const [selected, setSelected] = useState("in-progress");

  const options = [
    { label: "In-Progress", value: "in-progress" },
    { label: "Solved", value: "solved" },
    { label: "On-Hold", value: "on-hold" },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* <!-- Header --> */}
      <div className="flex flex-col justify-between gap-5 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center dark:border-gray-800">
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white/90">
            Ticket #346520 - Sidebar not responsive on mobile
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mon, 3:20 PM (2 days ago)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">4 of 120</p>
          <div className="flex items-center gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white/90">
              <svg
                className="stroke-current"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.7083 5L7.5 10.2083L12.7083 15.4167"
                  stroke=""
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white/90">
              <svg
                className="stroke-current"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.29167 15.8335L12.5 10.6252L7.29167 5.41683"
                  stroke=""
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="relative px-6 py-7">
        <div className="custom-scrollbar h-[calc(58vh-162px)] space-y-7 divide-y divide-gray-200 overflow-y-auto pr-2 dark:divide-gray-800">
          <article>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  width={40}
                  height={40}
                  src="/images/support/user-1.jpg"
                  className="h-10 w-10 shrink-0 rounded-full"
                  alt=""
                />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    John Doe
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    jhondelin@gmail.com
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Mon, 3:20 PM (2 hrs ago)
                </p>
              </div>
            </div>
            <div className="pb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hi TailAdmin Team,
              </p>
              <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                I hope you&apos;re doing well.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                I’m currently working on customizing the TailAdmin dashboard and
                would like to add a new section labeled “Reports.” Before I
                proceed, I wanted to check if there’s any official guide or best
                practice you recommend for adding custom pages within the
                TailAdmin structure.
              </p>
            </div>
          </article>
          <article>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  width={40}
                  height={40}
                  src="/images/support/user-2.jpg"
                  className="h-10 w-10 shrink-0 rounded-full"
                  alt=""
                />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    Musharof Chowdhury
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    From - tailadmin support team
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Mon, 3:20 PM (2 hrs ago)
                </p>
              </div>
            </div>
            <div className="pb-6">
              <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                Hi John D,
              </p>
              <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                Thanks for reaching out—and great to hear you&apos;re
                customizing TailAdmin to fit your needs! Yes, you can definitely
                add custom pages like a &quot;Reports&quot; section, and
                it&apos;s quite straightforward. Here&apos;s a quick guide to
                help you get started:
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                To include your new page in the sidebar:
              </p>
              <ul className="list-inside list-disc pl-2 text-sm text-gray-500 dark:text-gray-400">
                <li>
                  To include your new page in the sidebar: Go to the sidebar
                  configuration file (sidebarData.ts or similar)
                </li>
                <li>
                  Add a new entry with the label &quot;Reports&quot; and route
                  /reports
                </li>
              </ul>
            </div>
          </article>
          <article>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  width={40}
                  height={40}
                  src="/images/support/user-1.jpg"
                  className="h-10 w-10 shrink-0 rounded-full"
                  alt=""
                />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    John Doe
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    jhondelin@gmail.com
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Mon, 3:20 PM (2 hrs ago)
                </p>
              </div>
            </div>
            <div className="pb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hi TailAdmin Team,
              </p>
              <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                I hope you&apos;re doing well.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                I’m currently working on customizing the TailAdmin dashboard and
                would like to add a new section labeled “Reports.” Before I
                proceed, I wanted to check if there’s any official guide or best
                practice you recommend for adding custom pages within the
                TailAdmin structure.
              </p>
            </div>
          </article>
        </div>

        {/* <!-- Fixed Input Wrapper --> */}
        <div className="pt-5">
          {/* <!-- Container with max width --> */}
          <div className="mx-auto max-h-[162px] w-full rounded-2xl border border-gray-200 shadow-xs dark:border-gray-800 dark:bg-gray-800">
            {/* <!-- Textarea --> */}
            <textarea
              placeholder="Type your reply here..."
              className="h-20 w-full resize-none border-none bg-transparent p-5 font-normal text-gray-800 outline-none placeholder:text-gray-400 focus:ring-0 dark:text-white"
            ></textarea>

            {/* <!-- Bottom Section --> */}
            <div className="flex items-center justify-between p-3">
              <button className="flex h-9 items-center gap-1.5 rounded-lg bg-transparent px-2 py-3 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-300">
                {/* <!-- Attach Icon --> */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                >
                  <path
                    d="M14.4194 11.7679L15.4506 10.7367C17.1591 9.02811 17.1591 6.25802 15.4506 4.54947C13.742 2.84093 10.9719 2.84093 9.2634 4.54947L8.2322 5.58067M11.77 14.4172L10.7365 15.4507C9.02799 17.1592 6.2579 17.1592 4.54935 15.4507C2.84081 13.7422 2.84081 10.9721 4.54935 9.26352L5.58285 8.23002M11.7677 8.23232L8.2322 11.7679"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Attach
              </button>
              {/* <!-- Send Button --> */}
              <button className="bg-brand-500 hover:bg-brand-600 shadow-theme-xs inline-flex h-9 items-center justify-center rounded-lg px-4 py-3 text-sm font-medium text-white">
                Reply
              </button>
            </div>
          </div>
        </div>

        {/* Status */}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <span className="text-gray-500 dark:text-gray-400">Status:</span>
          <div className="flex items-center gap-4">
            {options.map((option) => (
              <label
                key={option.value}
                htmlFor={option.value}
                className="flex cursor-pointer items-center text-sm font-medium text-gray-700 select-none dark:text-gray-400"
              >
                <div className="relative">
                  <input
                    type="radio"
                    id={option.value}
                    value={option.value}
                    checked={selected === option.value}
                    onChange={() => setSelected(option.value)}
                    className="sr-only"
                  />
                  <div
                    className={`mr-3 flex h-4 w-4 items-center justify-center rounded-full border-[1.25px] hover:border-brand-500 dark:hover:border-brand-500 ${
                      selected === option.value
                        ? "border-brand-500 bg-brand-500"
                        : "bg-transparent border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        selected === option.value
                          ? "bg-white"
                          : "bg-white dark:bg-[#171f2e]"
                      }`}
                    ></span>
                  </div>
                </div>
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
