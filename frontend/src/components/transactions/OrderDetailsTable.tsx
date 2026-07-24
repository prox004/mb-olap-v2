import React from "react";

export default function OrderDetailsTable() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
      <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
        Order Details
      </h2>
      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="min-w-full text-left text-sm text-gray-700 dark:border-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr className="border-b border-gray-100 whitespace-nowrap dark:border-gray-800">
                <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">
                  S. No.
                </th>
                <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">
                  Products
                </th>
                <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">
                  Quantity
                </th>
                <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">
                  Unit Cost
                </th>
                <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">
                  Discount
                </th>
                <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-white/[0.03]">
              <tr>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  1
                </td>
                <td className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-800 dark:text-white/90">
                  Macbook pro 13”
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  1
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  $1200
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  0%
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  $1200
                </td>
              </tr>
              <tr>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  2
                </td>
                <td className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-800 dark:text-white/90">
                  Apple Watch Ultra
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  1
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  $300
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  50%
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  $150
                </td>
              </tr>
              <tr>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  3
                </td>
                <td className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-800 dark:text-white/90">
                  iPhone 15 Pro Max
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  2
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  $800
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  0%
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  $1600
                </td>
              </tr>
              <tr>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  4
                </td>
                <td className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-800 dark:text-white/90">
                  iPad Pro 3rd Gen
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  1
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  $900
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  0%
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  $900
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-wrap justify-between sm:justify-end">
        <div className="mt-6 w-full space-y-1 text-right sm:w-[220px]">
          <p className="mb-4 text-left text-sm font-medium text-gray-800 dark:text-white/90">
            Order summary
          </p>
          <ul className="space-y-2">
            <li className="flex justify-between gap-5">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Sub Total
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                $3,850
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Vat (10%):
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                $385
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-400">
                Total
              </span>
              <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
                $4,235
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
