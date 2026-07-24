export default function BillingPlan() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white xl:w-4/6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-6 py-5">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
          Plan Details
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-6 border-t border-gray-200 p-4 sm:p-6 lg:grid-cols-1 xl:grid-cols-2 dark:border-gray-800">
        {/* <!-- List --> */}
        <div>
          <ul className="divide-y divide-gray-100 rounded-t-xl border border-gray-200 p-5 dark:divide-gray-800 dark:border-gray-800">
            <li className="py-3 first:pt-0">
              <span className="block space-y-1.5 text-sm font-normal text-gray-500 dark:text-gray-400">
                Current Plan
              </span>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Professional
              </span>
            </li>
            <li className="py-3">
              <span className="block space-y-1.5 text-sm font-normal text-gray-500 dark:text-gray-400">
                Monthly Limits
              </span>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                25,000 Orders
              </span>
            </li>
            <li className="py-3">
              <span className="block space-y-1.5 text-sm font-normal text-gray-500 dark:text-gray-400">
                Cost
              </span>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                $199.00
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  /month
                </span>
              </span>
            </li>
            <li className="py-3">
              <span className="block space-y-1.5 text-sm font-normal text-gray-500 dark:text-gray-400">
                Renewal Date
              </span>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Mar 22, 2028
              </span>
            </li>
          </ul>
          <div className="rounded-b-xl border border-t-0 border-gray-200 p-5 dark:border-gray-800">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                Orders
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-400">
                15,299 of 25,500 orders used
              </span>
            </div>
            {/* <!-- Progress --> */}
            <div className="relative h-2 w-full rounded-sm bg-gray-200 dark:bg-gray-800">
              <div className="bg-brand-500 absolute left-0 h-full w-[55%] rounded-sm"></div>
            </div>
          </div>
        </div>
        {/* <!-- Benefits --> */}
        <div>
          <h3 className="mb-6 text-base font-medium text-gray-800 dark:text-white/90">
            Plan Benefits
          </h3>
          <ul className="space-y-3.5">
            <li className="flex items-center gap-2.5">
              <svg
                className="text-gray-700 dark:text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M12.5 4.86133L6.2221 11.1392L3.5 8.41713"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                25,500 orders per month
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <svg
                className="text-gray-700 dark:text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M12.5 4.86133L6.2221 11.1392L3.5 8.41713"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Unlimited integrations
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <svg
                className="text-gray-700 dark:text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M12.5 4.86133L6.2221 11.1392L3.5 8.41713"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Exclusive AutoFile discount
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <svg
                className="text-gray-700 dark:text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M12.5 4.86133L6.2221 11.1392L3.5 8.41713"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                10 GB Storage
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <svg
                className="text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M4.5 11.4992L11.4986 4.50058M4.5 4.50049L11.4986 11.4991"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm font-medium text-gray-400 line-through">
                Custom Templates
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <svg
                className="text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M4.5 11.4992L11.4986 4.50058M4.5 4.50049L11.4986 11.4991"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm font-medium text-gray-400 line-through">
                Advanced Marketing tool
              </span>
            </li>
          </ul>
          <div className="mt-24 flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
            <button
              type="button"
              className="shadow-theme-xs -mx-px flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              Cancel Subscription
            </button>
            <button
              type="button"
              className="bg-brand-500 shadow-theme-xs hover:bg-brand-600 flex w-full justify-center rounded-lg px-4 py-3 text-sm font-medium text-white"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
