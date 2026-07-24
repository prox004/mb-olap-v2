export default function TrackingProgress() {
  return (
    <div className="rounded-xl bg-white p-4 dark:bg-gray-900">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tracking ID
          </p>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            #28745-72809bjk
          </h3>
        </div>
        <div className="relative">
          <span className="bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500 inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium">
            In Transit
          </span>
        </div>
      </div>
      <div className="mt-5">
        {/* <!-- Timeline item --> */}
        <div className="relative pb-5 pl-11">
          {/* <!-- Icon --> */}
          <div className="text-brand-500 bg-brand-50 dark:ring-brand-500/15 ring-brand-50 dark:bg-brand-950 absolute top-0 left-0 z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white ring-2 dark:border-gray-700">
            {/* <!-- Shopping cart icon --> */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M15.1039 13.3343L13.5141 14.924L12.6039 14.0137M9.99967 3.33414H6.56405C6.11247 3.33414 5.69599 3.5777 5.47459 3.97128L3.49355 7.49292C3.44274 7.58326 3.40357 7.67918 3.37664 7.77839M9.99967 3.33414H13.4353C13.8869 3.33414 14.3034 3.5777 14.5248 3.97128L16.5058 7.49292C16.5566 7.58326 16.5958 7.67918 16.6227 7.77839M9.99967 3.33414V7.77839M9.99967 7.77839L16.6227 7.77839M9.99967 7.77839L3.37664 7.77839M16.6227 7.77839C16.6516 7.88467 16.6663 7.99474 16.6663 8.10578V8.43098M3.37664 7.77839C3.3478 7.88467 3.33301 7.99474 3.33301 8.10578V15.4168C3.33301 16.1071 3.89265 16.6668 4.58301 16.6668H8.02525M17.708 14.1292C17.708 16.2578 15.9824 17.9833 13.8538 17.9833C11.7252 17.9833 9.99967 16.2578 9.99967 14.1292C9.99967 12.0006 11.7252 10.275 13.8538 10.275C15.9824 10.275 17.708 12.0006 17.708 14.1292Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="ml-2 flex items-end justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                12 Apr 2028
              </p>
              <h4 className="font-medium text-gray-800 dark:text-white/90">
                Picked up
              </h4>
            </div>

            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                12:54
              </span>
            </div>
          </div>

          {/* <!-- Vertical line --> */}
          <div className="border-brand-500 absolute top-10 left-5 h-full w-px border border-dashed"></div>
        </div>

        {/* <!-- Timeline item --> */}
        <div className="relative pb-5 pl-11">
          {/* <!-- Icon --> */}
          <div className="text-brand-500 bg-brand-50 dark:ring-brand-500/15 ring-brand-50 dark:bg-brand-950 absolute top-0 left-0 z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white ring-2 dark:border-gray-700">
            {/* <!--Card icon --> */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M4.79199 3.33334H11.042C11.7323 3.33334 12.292 3.89299 12.292 4.58334V14.5833M12.292 14.5833V5.95003H14.3367C14.7517 5.95003 15.1396 6.15598 15.3721 6.49971L17.4941 9.63691C17.5607 9.73538 17.6125 9.84227 17.6485 9.95419M12.292 14.5833H12.2981M12.292 14.5833H8.01926M2.29199 14.5833H4.17306M17.7087 14.5833V10.3372C17.7087 10.2065 17.6882 10.0773 17.6485 9.95419M18.3337 14.5833H16.1443M8.95866 14.5833H12.2981M12.292 9.95419H17.6485M3.54199 6.45834H7.29199M7.29199 9.58334H2.29199M12.2981 14.5833C12.3766 13.59 13.2076 12.8083 14.2212 12.8083C15.2347 12.8083 16.0657 13.59 16.1443 14.5833M12.2981 14.5833C12.294 14.6342 12.292 14.6856 12.292 14.7375C12.292 15.803 13.1557 16.6667 14.2212 16.6667C15.2866 16.6667 16.1503 15.803 16.1503 14.7375C16.1503 14.6856 16.1483 14.6342 16.1443 14.5833M8.01926 14.5833C8.02328 14.6342 8.02533 14.6856 8.02533 14.7375C8.02533 15.803 7.16161 16.6667 6.09616 16.6667C5.03071 16.6667 4.16699 15.803 4.16699 14.7375C4.16699 14.6856 4.16904 14.6342 4.17306 14.5833M8.01926 14.5833C7.94071 13.59 7.10972 12.8083 6.09616 12.8083C5.0826 12.8083 4.25161 13.59 4.17306 14.5833"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="ml-2 flex justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                12 Apr 2028
              </p>
              <h4 className="font-medium text-gray-800 dark:text-white/90">
                In Transit
              </h4>
            </div>

            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                12:58
              </span>
            </div>
          </div>

          {/* <!-- Vertical line --> */}
          <div className="absolute top-10 left-5 z-1 h-full w-px border border-dashed border-gray-200 dark:border-gray-800"></div>
        </div>

        {/* <!-- Timeline item --> */}
        <div className="relative pl-11">
          {/* <!-- Icon --> */}
          <div className="dark:ring-brand-500/15 ring-brand-50 absolute top-0 left-0 z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-gray-700 ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            {/* <!--Card icon --> */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M3.54199 6.66667L1.66699 6.66667M2.91699 10H1.66699M2.29199 13.3333H1.66699M6.59715 15.9369H15.9578C16.5975 15.9369 17.1339 15.454 17.2009 14.8178L18.1877 5.44336C18.2654 4.70531 17.6867 4.0625 16.9446 4.0625H7.58398C6.94429 4.0625 6.40782 4.54546 6.34085 5.18164L5.35402 14.5561C5.27633 15.2941 5.85502 15.9369 6.59715 15.9369ZM11.2829 4.0625H13.5093L12.8843 8.22H10.6579L11.2829 4.0625Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="ml-2 flex justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                13 Apr 2028
              </p>
              <h4 className="font-medium text-gray-800 dark:text-white/90">
                Delivered
              </h4>
            </div>

            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                --:--
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
