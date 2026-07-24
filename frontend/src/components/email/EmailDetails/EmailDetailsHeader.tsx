"use client";
import useGoBack from "@/hooks/useGoBack";
import React from "react";

export default function EmailDetailsHeader() {
  const goBack = useGoBack();
  return (
    <div className="flex flex-col justify-between border-b border-gray-200 dark:border-gray-800 sm:flex-row">
      <div className="flex items-center justify-between w-full gap-3 px-4 py-4 sm:justify-normal">
        <button
          onClick={goBack}
          className="flex h-10 w-full max-w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-800 dark:border-gray-800 dark:bg-white/[0.03] transition dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-200"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M1.91634 7.99899C1.91612 8.19115 1.98928 8.38337 2.13583 8.53001L6.13316 12.5301C6.42595 12.8231 6.90082 12.8233 7.19382 12.5305C7.48681 12.2377 7.48698 11.7629 7.19419 11.4699L4.47396 8.74772L13.3339 8.74772C13.7481 8.74772 14.0839 8.41194 14.0839 7.99772C14.0839 7.58351 13.7481 7.24772 13.3339 7.24772L4.47834 7.24772L7.19417 4.53016C7.48697 4.23718 7.48682 3.7623 7.19383 3.4695C6.90085 3.1767 6.42597 3.17685 6.13317 3.46984L2.17075 7.43478C2.01476 7.57222 1.91634 7.77347 1.91634 7.99772C1.91634 7.99815 1.91634 7.99857 1.91634 7.99899Z"
              fill="currentColor"
            />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex">
            <button className="flex h-10 w-10 items-center justify-center text-gray-500 ring-1 ring-inset ring-gray-200 first:rounded-l-lg last:rounded-r-lg hover:bg-gray-100 transition hover:text-error-500 dark:bg-white/[0.03] dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-error-500">
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
                  d="M6.54118 3.7915C6.54118 2.54886 7.54854 1.5415 8.79118 1.5415H11.2078C12.4505 1.5415 13.4578 2.54886 13.4578 3.7915V4.0415H15.6249H16.6658C17.08 4.0415 17.4158 4.37729 17.4158 4.7915C17.4158 5.20572 17.08 5.5415 16.6658 5.5415H16.3749V8.24638V13.2464V16.2082C16.3749 17.4508 15.3676 18.4582 14.1249 18.4582H5.87492C4.63228 18.4582 3.62492 17.4508 3.62492 16.2082V13.2464V8.24638V5.5415H3.33325C2.91904 5.5415 2.58325 5.20572 2.58325 4.7915C2.58325 4.37729 2.91904 4.0415 3.33325 4.0415H4.37492H6.54118V3.7915ZM14.8749 13.2464V8.24638V5.5415H13.4578H12.7078H7.29118H6.54118H5.12492V8.24638V13.2464V16.2082C5.12492 16.6224 5.46071 16.9582 5.87492 16.9582H14.1249C14.5391 16.9582 14.8749 16.6224 14.8749 16.2082V13.2464ZM8.04118 4.0415H11.9578V3.7915C11.9578 3.37729 11.6221 3.0415 11.2078 3.0415H8.79118C8.37696 3.0415 8.04118 3.37729 8.04118 3.7915V4.0415ZM8.33325 7.99984C8.74747 7.99984 9.08325 8.33562 9.08325 8.74984V13.7498C9.08325 14.1641 8.74747 14.4998 8.33325 14.4998C7.91904 14.4998 7.58325 14.1641 7.58325 13.7498V8.74984C7.58325 8.33562 7.91904 7.99984 8.33325 7.99984ZM12.4166 8.74984C12.4166 8.33562 12.0808 7.99984 11.6666 7.99984C11.2524 7.99984 10.9166 8.33562 10.9166 8.74984V13.7498C10.9166 14.1641 11.2524 14.4998 11.6666 14.4998C12.0808 14.4998 12.4166 14.1641 12.4166 13.7498V8.74984Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <button className="-ml-px flex h-10 w-10 items-center justify-center text-gray-500 ring-1 ring-inset ring-gray-200 first:rounded-l-lg last:rounded-r-lg hover:bg-gray-100 transition hover:text-gray-700 dark:bg-white/[0.03] dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-white">
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
                  d="M3.04167 9.99984C3.04167 6.15686 6.15702 3.0415 10 3.0415C13.843 3.0415 16.9583 6.15686 16.9583 9.99984C16.9583 13.8428 13.843 16.9582 10 16.9582C6.15702 16.9582 3.04167 13.8428 3.04167 9.99984ZM10 1.5415C5.3286 1.5415 1.54167 5.32843 1.54167 9.99984C1.54167 14.6712 5.3286 18.4582 10 18.4582C14.6714 18.4582 18.4583 14.6712 18.4583 9.99984C18.4583 5.32843 14.6714 1.5415 10 1.5415ZM9.09926 6.27073C9.09926 6.76779 9.50221 7.17073 9.99926 7.17073H10.0003C10.4973 7.17073 10.9003 6.76779 10.9003 6.27073C10.9003 5.77368 10.4973 5.37073 10.0003 5.37073H9.99926C9.50221 5.37073 9.09926 5.77368 9.09926 6.27073ZM10.0001 14.601C9.58586 14.601 9.25008 14.2652 9.25008 13.851V9.12059C9.25008 8.70637 9.58586 8.37059 10.0001 8.37059C10.4143 8.37059 10.7501 8.70637 10.7501 9.12059V13.851C10.7501 14.2652 10.4143 14.601 10.0001 14.601Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <button className="-ml-px flex h-10 w-10 items-center justify-center rounded-r-lg text-gray-500 ring-1 ring-inset ring-gray-200 first:rounded-l-lg last:rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-white/[0.03] dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.05] transition dark:hover:text-white">
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
                  d="M1.54163 4.8335C1.54163 3.59085 2.54899 2.5835 3.79163 2.5835H16.2083C17.4509 2.5835 18.4583 3.59085 18.4583 4.8335V5.16683C18.4583 5.96477 18.0429 6.66569 17.4166 7.06517V15.1668C17.4166 16.4095 16.4093 17.4168 15.1666 17.4168H4.83329C3.59065 17.4168 2.58329 16.4095 2.58329 15.1668V7.06517C1.95699 6.66568 1.54163 5.96476 1.54163 5.16683V4.8335ZM4.08329 7.41683H15.9166V15.1668C15.9166 15.581 15.5808 15.9168 15.1666 15.9168H4.83329C4.41908 15.9168 4.08329 15.581 4.08329 15.1668V7.41683ZM16.9583 5.16683C16.9583 5.58104 16.6225 5.91683 16.2083 5.91683H3.79163C3.37741 5.91683 3.04163 5.58104 3.04163 5.16683V4.8335C3.04163 4.41928 3.37741 4.0835 3.79163 4.0835H16.2083C16.6225 4.0835 16.9583 4.41928 16.9583 4.8335V5.16683ZM8.33329 9.04183C7.91908 9.04183 7.58329 9.37762 7.58329 9.79183C7.58329 10.206 7.91908 10.5418 8.33329 10.5418H11.6666C12.0808 10.5418 12.4166 10.206 12.4166 9.79183C12.4166 9.37762 12.0808 9.04183 11.6666 9.04183H8.33329Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>

          <button className="flex h-10 transition w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
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
                d="M3.04166 7.06206V14.375C3.04166 14.6511 3.26551 14.875 3.54166 14.875H16.4583C16.7345 14.875 16.9583 14.6511 16.9583 14.375V7.06245L11.1443 11.1168C10.4569 11.5961 9.54364 11.5961 8.85629 11.1168L3.04166 7.06206ZM16.9583 5.19262C16.9583 5.19341 16.9583 5.1942 16.9583 5.19498V5.20026C16.9571 5.22216 16.946 5.24239 16.9279 5.25501L10.2863 9.88638C10.1144 10.0062 9.88611 10.0062 9.71428 9.88638L3.07246 5.25485C3.05333 5.24151 3.04193 5.21967 3.04192 5.19636C3.04191 5.15695 3.07385 5.125 3.11326 5.125H16.887C16.9252 5.125 16.9564 5.15494 16.9583 5.19262ZM18.4583 5.21428V14.375C18.4583 15.4796 17.5629 16.375 16.4583 16.375H3.54166C2.43709 16.375 1.54166 15.4796 1.54166 14.375V5.19498C1.54166 5.1852 1.54184 5.17546 1.54221 5.16577C1.55849 4.31209 2.25561 3.625 3.11326 3.625H16.887C17.7548 3.625 18.4583 4.32843 18.4584 5.19622C18.4584 5.20225 18.4584 5.20826 18.4583 5.21428Z"
                fill=""
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between w-full gap-4 px-4 py-3 border-t border-gray-200 dark:border-gray-800 sm:justify-end sm:border-t-0 sm:py-5">
        <p className="text-sm text-gray-500 dark:text-gray-400">4 of 120</p>
        <div className="flex items-center justify-end gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:text-gray-200 dark:text-gray-400 dark:hover:bg-white/[0.07] transition">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.7083 5L7.5 10.2083L12.7083 15.4167"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]  dark:hover:text-gray-200 dark:text-gray-400 dark:hover:bg-white/[0.07] transition">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.29167 15.8335L12.5 10.6252L7.29167 5.41683"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
