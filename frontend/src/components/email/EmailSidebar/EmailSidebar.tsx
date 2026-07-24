"use client";
import LabelList from "./LabelList";
import MailBox from "./MailBox";
import FilterList from "./FilterList";
import SimpleBar from "simplebar-react";

export default function EmailSidebar() {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="pb-5">
        <button className="flex items-center justify-center w-full gap-2 p-3 text-sm font-medium text-white rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600">
          <svg
            className="fill-current"
            width="21"
            height="20"
            viewBox="0 0 21 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M17.0911 3.03206C16.2124 2.15338 14.7878 2.15338 13.9091 3.03206L5.6074 11.3337C5.29899 11.6421 5.08687 12.0335 4.99684 12.4603L4.26177 15.945C4.20943 16.1931 4.286 16.4508 4.46529 16.6301C4.64458 16.8094 4.90232 16.8859 5.15042 16.8336L8.63507 16.0985C9.06184 16.0085 9.45324 15.7964 9.76165 15.488L18.0633 7.18631C18.942 6.30763 18.942 4.88301 18.0633 4.00433L17.0911 3.03206ZM14.9697 4.09272C15.2626 3.79982 15.7375 3.79982 16.0304 4.09272L17.0027 5.06499C17.2956 5.35788 17.2956 5.83276 17.0027 6.12565L16.1043 7.02402L14.0714 4.99109L14.9697 4.09272ZM13.0107 6.05175L6.66806 12.3944C6.56526 12.4972 6.49455 12.6277 6.46454 12.7699L5.96704 15.1283L8.32547 14.6308C8.46772 14.6008 8.59819 14.5301 8.70099 14.4273L15.0436 8.08468L13.0107 6.05175Z"
              fill=""
            />
          </svg>
          Compose
        </button>
      </div>
      <SimpleBar className="custom-scrollbar max-h-[550px] 2xl:max-h-[670px]">
        {/* <!--== Inbox Menu Start ==--> */}
        <nav className="space-y-5">
          {/* <!--== Mailbox Group Start ==--> */}
          <div>
            <h3 className="mb-3 text-xs font-medium uppercase leading-[18px] text-gray-700 dark:text-gray-400">
              MAILBOX
            </h3>
            <MailBox />
          </div>
          {/* <!--== Mailbox Group End ==--> */}

          {/* <!--== Filter Group Start ==--> */}
          <div>
            <h3 className="mb-3 text-xs font-medium uppercase leading-[18px] text-gray-700 dark:text-gray-400">
              FILTER
            </h3>
            <FilterList />
          </div>
          {/* <!--== Filter Group End ==--> */}

          {/* <!--== Label Group Start ==--> */}
          <div>
            <h3 className="mb-3 text-xs font-medium uppercase leading-[18px] text-gray-700 dark:text-gray-400">
              LABEL
            </h3>
            <LabelList />
          </div>
          {/* //   <!--== Label Group End ==--> */}
        </nav>
        {/* // <!--== Inbox Menu End ==--> */}
      </SimpleBar>
    </div>
  );
}
