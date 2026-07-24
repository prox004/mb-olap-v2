"use client";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import React from "react";

export default function InvoicePreviewModal() {
  const { isOpen, openModal, closeModal } = useModal();
  return (
    <>
      <Button variant="outline" onClick={openModal}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M2.46585 10.7925C2.23404 10.2899 2.23404 9.71023 2.46585 9.20764C3.78181 6.35442 6.66064 4.375 10.0003 4.375C13.3399 4.375 16.2187 6.35442 17.5347 9.20765C17.7665 9.71024 17.7665 10.2899 17.5347 10.7925C16.2187 13.6458 13.3399 15.6252 10.0003 15.6252C6.66064 15.6252 3.78181 13.6458 2.46585 10.7925Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.0212 10C13.0212 11.6684 11.6687 13.0208 10.0003 13.0208C8.33196 13.0208 6.97949 11.6684 6.97949 10C6.97949 8.33164 8.33196 6.97917 10.0003 6.97917C11.6687 6.97917 13.0212 8.33164 13.0212 10Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Preview Invoice
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="relative max-w-[720px] m-5 rounded-3xl bg-white dark:bg-gray-900"
      >
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="text-lg text-gray-700 dark:text-gray-500">
            Invoice: #34834
          </h3>
        </div>
        <div className="max-h-[598px] overflow-y-auto p-4 sm:p-6">
          <div className="mb-9 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
                From
              </span>

              <h5 className="mb-2 text-base font-semibold text-gray-800 dark:text-white/90">
                Pimjo LLC
              </h5>

              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                1280, Clair Street, <br />
                Massachusetts, New York - 02543
              </p>

              <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Issued On:
              </span>

              <span className="block text-sm text-gray-500 dark:text-gray-400">
                11 March, 2027
              </span>
            </div>

            <div className="h-px w-full bg-gray-200 sm:h-[158px] sm:w-px dark:bg-gray-800"></div>

            <div className="sm:text-right">
              <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
                To
              </span>

              <h5 className="mb-2 text-base font-semibold text-gray-800 dark:text-white/90">
                Albert Ward
              </h5>

              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                355, Shobe Lane <br />
                Colorado, Fort Collins - 80543
              </p>

              <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Due On:
              </span>

              <span className="block text-sm text-gray-500 dark:text-gray-400">
                16 March, 2027
              </span>
            </div>
          </div>

          {/* <!-- Invoice Table Start --> */}
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
            <table className="min-w-full text-left text-gray-700 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 whitespace-nowrap py-3 text-sm font-medium text-gray-700 dark:text-gray-400">
                    S.No.#
                  </th>
                  <th className="px-5 py-3 text-xs font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">
                    Products
                  </th>
                  <th className="px-5 py-3 text-center text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">
                    Quantity
                  </th>
                  <th className="px-5 py-3 text-center text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">
                    Unit Cost
                  </th>
                  <th className="px-5 py-3 text-center text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">
                    Discount
                  </th>
                  <th className="px-5 py-3 text-right text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr>
                  <td className="px-5 py-3 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                    1
                  </td>
                  <td className="px-5 py-3 text-sm whitespace-nowrap font-medium text-gray-800 dark:text-white/90">
                    Macbook pro 13”
                  </td>
                  <td className="px-5 py-3 text-center  text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                    1
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    $48
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    0%
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                    $1,200
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                    2
                  </td>
                  <td className="px-5 py-3 text-sm whitespace-nowrap font-medium text-gray-800 dark:text-white/90">
                    Apple Watch Ultra
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    1
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    $300
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    50%
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                    $150
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                    3
                  </td>
                  <td className="px-5 py-3 text-sm whitespace-nowrap font-medium text-gray-800 dark:text-white/90">
                    iPhone 15 Pro Max
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    3
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    $800
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    0%
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                    $1,600
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                    4
                  </td>
                  <td className="px-5 py-3 text-sm whitespace-nowrap font-medium text-gray-800 dark:text-white/90">
                    iPad Pro 3rd Gen
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    1
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    $900
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    0%
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                    $900
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* <!-- Invoice Table End --> */}

          <div className="my-6 flex justify-end pb-6 text-right">
            <div className="w-[220px]">
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
      </Modal>
    </>
  );
}
