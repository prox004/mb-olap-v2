"use client";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import React from "react";

export default function BillingInfo() {
  const { isOpen, openModal, closeModal } = useModal();
  const handleSave = () => {
    // Handle save logic here
    console.log("Saving changes...");
    closeModal();
  };
  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white xl:w-2/6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-5">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            Billing Info
          </h3>
        </div>
        <div className="border-t border-gray-200 p-4 sm:p-6 dark:border-gray-800">
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            <li className="flex items-center gap-5 py-2.5">
              <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
                Name
              </span>
              <span className="w-1/2 text-sm font-medium text-gray-700 sm:w-2/3 dark:text-gray-400">
                Mushafrof Chowdhury
              </span>
            </li>
            <li className="flex items-center gap-5 py-2.5">
              <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
                Street
              </span>
              <span className="w-1/2 text-sm font-medium text-gray-700 sm:w-2/3 dark:text-gray-400">
                800 E Elcamino Real, suite #400
              </span>
            </li>
            <li className="flex items-center gap-5 py-2.5">
              <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
                City/State
              </span>
              <span className="w-1/2 text-sm font-medium text-gray-700 sm:w-2/3 dark:text-gray-400">
                Mountain View, CA, 94040
              </span>
            </li>
            <li className="flex items-center gap-5 py-2.5">
              <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
                Country
              </span>
              <span className="w-1/2 text-sm font-medium text-gray-700 sm:w-2/3 dark:text-gray-400">
                United States of America
              </span>
            </li>
            <li className="flex items-center gap-5 py-2.5">
              <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
                Zip/Postal code
              </span>
              <span className="w-1/2 text-sm font-medium text-gray-700 sm:w-2/3 dark:text-gray-400">
                19029
              </span>
            </li>
            <li className="flex items-center gap-5 py-2.5">
              <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
                Town/City
              </span>
              <span className="w-1/2 text-sm font-medium text-gray-700 sm:w-2/3 dark:text-gray-400">
                New York
              </span>
            </li>
            <li className="flex items-center gap-5 py-2.5">
              <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
                VAT Number
              </span>
              <span className="w-1/2 text-sm font-medium text-gray-700 sm:w-2/3 dark:text-gray-400">
                DE4920348
              </span>
            </li>
          </ul>

          <div className="mt-10 xl:mt-2 2xl:mt-12">
            <Button
              onClick={openModal}
              variant="outline"
              className="w-full h-11"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="20"
                viewBox="0 0 21 20"
                fill="none"
              >
                <path
                  d="M12.8861 5.08135L15.4182 7.61345M16.1437 3.59219L16.908 4.35652C17.3962 4.84468 17.3962 5.63613 16.908 6.12429L8.33547 14.6968C8.19039 14.8419 8.01182 14.9491 7.81554 15.0088L4.47461 16.0256L5.49141 12.6847C5.55115 12.4884 5.65829 12.3098 5.80337 12.1647L14.3759 3.59219C14.8641 3.10404 15.6555 3.10404 16.1437 3.59219Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Update Billing Address
            </Button>
          </div>
        </div>
      </div>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="relative w-full max-w-[558px] m-5 sm:m-0 rounded-3xl bg-white p-6 lg:p-10 dark:bg-gray-900"
      >
        <div>
          <div className="px-1">
            <h4 className="text-title-xs mb-1 font-semibold text-gray-800 dark:text-white/90">
              Billing Settings
            </h4>
            <p className="mb-7 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Edit your billing address, card info, or payment method.
            </p>
          </div>

          <div className="custom-scrollbar h-[490px] overflow-y-auto sm:h-auto px-1">
            <form action="#">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    First Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Mushafrof"
                    className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Last Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Chowdhury"
                    className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  />
                </div>
                <div className="sm:col-span-full">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Street
                  </label>
                  <input
                    type="text"
                    defaultValue="800 E Elcamino Real, suite #400"
                    className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Country
                  </label>
                  <div className="relative z-20 bg-transparent">
                    <select className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30">
                      <option
                        value=""
                        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                      >
                        Select Option
                      </option>
                      <option
                        value=""
                        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                      >
                        USA
                      </option>
                      <option
                        value=""
                        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                      >
                        UK
                      </option>
                      <option
                        value=""
                        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                      >
                        BD
                      </option>
                      <option
                        value=""
                        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                      >
                        EU
                      </option>
                      <option
                        value=""
                        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                      >
                        ID
                      </option>
                    </select>
                    <span className="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      <svg
                        className="stroke-current"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396"
                          stroke=""
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Town/City
                  </label>
                  <div className="relative z-20 bg-transparent">
                    <select className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30">
                      <option
                        value=""
                        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                      >
                        Select Option
                      </option>
                      <option
                        value=""
                        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                      >
                        New York
                      </option>
                      <option
                        value=""
                        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                      >
                        Tokyo
                      </option>
                      <option
                        value=""
                        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                      >
                        Chicago
                      </option>
                      <option
                        value=""
                        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                      >
                        Los Angels
                      </option>
                      <option
                        value=""
                        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                      >
                        Berlin
                      </option>
                    </select>
                    <span className="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      <svg
                        className="stroke-current"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396"
                          stroke=""
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Zip/Postal code
                  </label>
                  <input
                    type="text"
                    defaultValue="19029"
                    className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    VAT Number
                  </label>
                  <input
                    type="text"
                    defaultValue="DE4920348"
                    className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  />
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Click “Update Info” to update your billing information.
              </p>
            </form>
          </div>
          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              onClick={closeModal}
              type="button"
              className="shadow-theme-xs flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              type="button"
              className="bg-brand-500 shadow-theme-xs hover:bg-brand-600 flex justify-center rounded-lg px-4 py-3 text-sm font-medium text-white"
            >
              Update Info
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
