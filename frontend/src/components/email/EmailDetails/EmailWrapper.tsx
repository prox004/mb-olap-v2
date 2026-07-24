"use client";
import Image from "next/image";
import React from "react";
import SimpleBar from "simplebar-react";
import EmailDetailsHeader from "./EmailDetailsHeader";
import EmailDetailsBottom from "./EmailDetailsBottom";

export default function EmailWrapper() {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:h-full">
      <EmailDetailsHeader />
      <SimpleBar className="custom-scrollbar max-h-[500px] 2xl:max-h-[780px]">
        <div className=" p-5  xl:p-6">
          <div className="flex items-center gap-3 mb-9">
            <div className="w-12 h-12 overflow-hidden rounded-full">
              <Image
                width={48}
                height={48}
                src="/images/user/user-18.jpg"
                alt="user"
              />
            </div>

            <div>
              <span className="mb-0.5 block text-sm font-medium text-gray-800 dark:text-white/90">
                Contact For “Website Design”
              </span>
              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                Codescandy hello@example.com
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-500 mb-7 dark:text-gray-400">
            <p className="mb-4">Hello Dear Alexander,</p>

            <p className="mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent
              ut rutrum mi. Aenean ac leo non justo suscipit consectetur. Nam
              vestibulum eleifend magna quis porta. ipsum dolor sit amet,
              consectetur adipiscing elit. Praesent ut rutrum mi. Aenean ac leo
            </p>

            <p className="mb-4">
              Praesent ut rutrum mi. Aenean ac leo non justo suscipit
              consectetur. Nam vestibulum eleifend magna quis porta.
            </p>

            <p className="mb-4">
              Nullam tincidunt sodales diam, quis rhoncus dolor aliquet a. Nulla
              a rhoncus lectus. In nunc neque, pellentesque non massa ornare,
              accumsan ornare massa. odales diam, quis rhoncus dolor aliquet a.
              Nulla a rhoncus lectus. In nunc neque
            </p>

            <p className="mb-4">
              Suspendisse semper vel turpis vitae aliquam. Aenean semper dui in
              consequat ullamcorper.
            </p>

            <p className="mb-4">
              Nullam tincidunt sodales diam, quis rhoncus dolor aliquet a. Nulla
              a rhoncus lectus. In nunc neque, pellentesque non massa ornare,
              accumsan ornare massa. sodales diam, quis rhoncus dolor aliquet a.
              Nulla a rhoncus lectus. In nunc neque
            </p>

            <p>
              Praesent ut rutrum mi. Aenean ac leo non justo suscipit
              consectetur. Nam vestibulum eleifend magna quis porta.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 sm:p-4">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-gray-500 dark:text-gray-400">
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
                    d="M10.6685 12.035C10.6685 12.044 10.6686 12.0529 10.6689 12.0617V13.4533C10.6689 13.8224 10.3697 14.1216 10.0006 14.1216C9.63155 14.1216 9.33235 13.8224 9.33235 13.4533V5.12807C9.33235 4.71385 8.99657 4.37807 8.58235 4.37807C8.16814 4.37807 7.83235 4.71385 7.83235 5.12807V13.4533C7.83235 14.6508 8.80313 15.6216 10.0006 15.6216C11.1981 15.6216 12.1689 14.6508 12.1689 13.4533V5.12807C12.1689 5.11803 12.1687 5.10804 12.1683 5.09811C12.1522 3.1311 10.5527 1.5415 8.58189 1.5415C6.60108 1.5415 4.99532 3.14727 4.99532 5.12807L4.99532 12.035C4.99532 12.0414 4.9954 12.0477 4.99556 12.0539V13.4533C4.99556 16.2174 7.2363 18.4582 10.0004 18.4582C12.7645 18.4582 15.0053 16.2174 15.0053 13.4533V7.96463C15.0053 7.55042 14.6695 7.21463 14.2553 7.21463C13.841 7.21463 13.5053 7.55042 13.5053 7.96463V13.4533C13.5053 15.389 11.9361 16.9582 10.0004 16.9582C8.06473 16.9582 6.49556 15.389 6.49556 13.4533V7.96463C6.49556 7.95832 6.49548 7.95202 6.49532 7.94574L6.49532 5.12807C6.49532 3.97569 7.42951 3.0415 8.58189 3.0415C9.73427 3.0415 10.6685 3.97569 10.6685 5.12807L10.6685 12.035Z"
                    fill=""
                  />
                </svg>
              </span>

              <span className="text-sm text-gray-700 dark:text-gray-400">
                2 Attachments
              </span>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <div className="relative hover:border-gray-300 dark:hover:border-white/[0.05] flex w-full cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-5 dark:border-gray-800 dark:bg-white/5 sm:w-auto">
                <div className="w-full h-10 max-w-10">
                  <Image
                    src="./images/task/pdf.svg"
                    width={40}
                    height={40}
                    className="w-full"
                    alt="icon"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    Guidelines.pdf
                  </p>
                  <span className="flex items-center gap-1.5">
                    <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                      PDF
                    </span>
                    <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                      Download
                    </span>
                  </span>
                </div>
              </div>

              <div className="relative hover:border-gray-300 dark:hover:border-white/[0.05] flex w-full cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-5 dark:border-gray-800 dark:bg-white/5 sm:w-auto">
                <div className="w-full h-10 max-w-10">
                  <Image
                    width={40}
                    height={40}
                    src="./images/task/google-drive.svg"
                    alt="icon"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    Branding Assets
                  </p>
                  <span className="flex items-center gap-1.5">
                    <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                      Media
                    </span>
                    <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                      Download
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SimpleBar>
      <EmailDetailsBottom />
    </div>
  );
}
