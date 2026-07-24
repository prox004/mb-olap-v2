"use client";
import Switch from "../form/switch/Switch";
import AddApiKeyModal from "./AddApiKeyModal";
import { useState } from "react";

interface ApiKey {
  id: string;
  name: string;
  value: string;
  status: "Active" | "Disabled";
  created: string;
  lastUsed: string;
  hasToggle: boolean;
}

const apiKeysData: ApiKey[] = [
  {
    id: "1",
    name: "Production API key",
    value: "sk_live_**********4248",
    status: "Disabled",
    created: "25 Jan, 2025",
    lastUsed: "Today, 10:45 AM",
    hasToggle: true,
  },
  {
    id: "2",
    name: "Development API key",
    value: "dev_live_**********4923",
    status: "Active",
    created: "29 Dec, 2024",
    lastUsed: "Today, 12:40 AM",
    hasToggle: false,
  },
  {
    id: "3",
    name: "Legacy API Key",
    value: "leg_live_**********0932",
    status: "Active",
    created: "12 Mar, 2024",
    lastUsed: "Today, 11:45 PM",
    hasToggle: false,
  },
];

export default function ApiKeyTable() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Optionally handle error
    }
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 pl-5 dark:border-gray-800 dark:bg-white/3">
      <div className="flex flex-col gap-5 sm:flex-row  sm:items-center justify-between border-b border-gray-100 py-4 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            API Keys
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            API keys are used to authentication requests to the tailadmin API
          </p>
        </div>
        <div>
          <AddApiKeyModal />
        </div>
      </div>
      <div className="custom-scrollbar overflow-x-auto px-1 pb-4">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="py-3 pr-5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Name
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Created
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Last used
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Disable/Enable
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {apiKeysData.map((apiKey) => (
              <tr key={apiKey.id}>
                <td className="py-3 pr-5 whitespace-nowrap">
                  <div>
                    <label
                      htmlFor={`api-${apiKey.id}`}
                      className="mb-2 inline-block text-sm text-gray-700 dark:text-gray-400"
                    >
                      {apiKey.name}
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          value={apiKey.value}
                          type="api"
                          id={`api-${apiKey.id}`}
                          className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full min-w-[360px] rounded-lg border border-gray-300 bg-transparent py-3 pr-[90px] pl-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                          readOnly
                        />
                        <button
                          id={`copy-button-${apiKey.id}`}
                          className="absolute top-1/2 right-0 inline-flex h-11 -translate-y-1/2 cursor-pointer items-center gap-1 rounded-r-lg border border-gray-300 py-3 pr-3 pl-3.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          onClick={() => handleCopy(apiKey.value, apiKey.id)}
                          disabled={copiedId === apiKey.id}
                        >
                          {copiedId === apiKey.id ? (
                            <>
                              <svg
                                className="fill-current "
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M7.999 14.2l-4.2-4.2 1.4-1.4 2.8 2.8 6-6 1.4 1.4-7.4 7.4z"
                                  fill="currentColor"
                                />
                              </svg>
                              <span className="ml-1">Copied!</span>
                            </>
                          ) : (
                            <>
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
                                  d="M6.58822 4.58398C6.58822 4.30784 6.81207 4.08398 7.08822 4.08398H15.4154C15.6915 4.08398 15.9154 4.30784 15.9154 4.58398L15.9154 12.9128C15.9154 13.189 15.6916 13.4128 15.4154 13.4128H7.08821C6.81207 13.4128 6.58822 13.189 6.58822 12.9128V4.58398ZM7.08822 2.58398C5.98365 2.58398 5.08822 3.47942 5.08822 4.58398V5.09416H4.58496C3.48039 5.09416 2.58496 5.98959 2.58496 7.09416V15.4161C2.58496 16.5207 3.48039 17.4161 4.58496 17.4161H12.9069C14.0115 17.4161 14.9069 16.5207 14.9069 15.4161L14.9069 14.9128H15.4154C16.52 14.9128 17.4154 14.0174 17.4154 12.9128L17.4154 4.58398C17.4154 3.47941 16.52 2.58398 15.4154 2.58398H7.08822ZM13.4069 14.9128H7.08821C5.98364 14.9128 5.08822 14.0174 5.08822 12.9128V6.59416H4.58496C4.30882 6.59416 4.08496 6.81801 4.08496 7.09416V15.4161C4.08496 15.6922 4.30882 15.9161 4.58496 15.9161H12.9069C13.183 15.9161 13.4069 15.6922 13.4069 15.4161L13.4069 14.9128Z"
                                  fill=""
                                />
                              </svg>
                              <div id="copy-text">Copy</div>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="group relative inline-block">
                        <button className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-400 ">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                          >
                            <path
                              d="M17.0436 8.11306C16.6282 6.56272 15.7128 5.19276 14.4395 4.21568C13.1661 3.2386 11.6059 2.70898 10.0009 2.70898C8.39585 2.70898 6.83566 3.2386 5.5623 4.21568C4.28894 5.19276 3.37357 6.56271 2.95816 8.11306C2.87345 8.42919 2.81944 8.65089 2.78711 8.80352M2.9559 11.8866C3.37131 13.437 4.28668 14.8069 5.56004 15.784C6.8334 16.7611 8.39359 17.2907 9.99862 17.2907C11.6037 17.2907 13.1638 16.7611 14.4372 15.784C15.7106 14.8069 16.6259 13.437 17.0414 11.8866C17.1278 11.5641 17.1826 11.3399 17.2152 11.1871M5.4327 7.49705L2.86544 8.94265L2.78711 8.80352M1.41992 6.37512L2.78711 8.80352M14.575 12.503L17.1422 11.0574L17.2152 11.1871M18.5877 13.6249L17.2152 11.1871"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <div className="invisible absolute bottom-full left-1/2 z-9999 mb-2.5 -translate-x-1/2 opacity-0 transition-opacity duration-300 group-hover:visible group-hover:opacity-100">
                          <div className="relative">
                            <div className="rounded-lg bg-white px-3 py-2 text-xs font-medium whitespace-nowrap text-gray-700 shadow-xs dark:bg-[#1E2634] dark:text-white">
                              Regenerate
                            </div>
                            <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-white dark:bg-[#1E2634]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      apiKey.status === "Active"
                        ? "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-500"
                        : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
                    }`}
                  >
                    {apiKey.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {apiKey.created}
                </td>
                <td className="px-5 py-3 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {apiKey.lastUsed}
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <Switch defaultChecked={apiKey.status === "Active"} />
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <div className="flex w-full items-center gap-3">
                    <button className="hover:text-error-500 dark:hover:text-error-500 text-gray-500 dark:text-gray-400">
                      <svg
                        className="fill-current"
                        width="21"
                        height="21"
                        viewBox="0 0 21 21"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M7.04142 4.29199C7.04142 3.04935 8.04878 2.04199 9.29142 2.04199H11.7081C12.9507 2.04199 13.9581 3.04935 13.9581 4.29199V4.54199H16.1252H17.166C17.5802 4.54199 17.916 4.87778 17.916 5.29199C17.916 5.70621 17.5802 6.04199 17.166 6.04199H16.8752V8.74687V13.7469V16.7087C16.8752 17.9513 15.8678 18.9587 14.6252 18.9587H6.37516C5.13252 18.9587 4.12516 17.9513 4.12516 16.7087V13.7469V8.74687V6.04199H3.8335C3.41928 6.04199 3.0835 5.70621 3.0835 5.29199C3.0835 4.87778 3.41928 4.54199 3.8335 4.54199H4.87516H7.04142V4.29199ZM15.3752 13.7469V8.74687V6.04199H13.9581H13.2081H7.79142H7.04142H5.62516V8.74687V13.7469V16.7087C5.62516 17.1229 5.96095 17.4587 6.37516 17.4587H14.6252C15.0394 17.4587 15.3752 17.1229 15.3752 16.7087V13.7469ZM8.54142 4.54199H12.4581V4.29199C12.4581 3.87778 12.1223 3.54199 11.7081 3.54199H9.29142C8.87721 3.54199 8.54142 3.87778 8.54142 4.29199V4.54199ZM8.8335 8.50033C9.24771 8.50033 9.5835 8.83611 9.5835 9.25033V14.2503C9.5835 14.6645 9.24771 15.0003 8.8335 15.0003C8.41928 15.0003 8.0835 14.6645 8.0835 14.2503V9.25033C8.0835 8.83611 8.41928 8.50033 8.8335 8.50033ZM12.9168 9.25033C12.9168 8.83611 12.581 8.50033 12.1668 8.50033C11.7526 8.50033 11.4168 8.83611 11.4168 9.25033V14.2503C11.4168 14.6645 11.7526 15.0003 12.1668 15.0003C12.581 15.0003 12.9168 14.6645 12.9168 14.2503V9.25033Z"
                          fill=""
                        />
                      </svg>
                    </button>
                    <button className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90">
                      <svg
                        className="fill-current"
                        width="21"
                        height="21"
                        viewBox="0 0 21 21"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M17.0911 3.53206C16.2124 2.65338 14.7878 2.65338 13.9091 3.53206L5.6074 11.8337C5.29899 12.1421 5.08687 12.5335 4.99684 12.9603L4.26177 16.445C4.20943 16.6931 4.286 16.9508 4.46529 17.1301C4.64458 17.3094 4.90232 17.3859 5.15042 17.3336L8.63507 16.5985C9.06184 16.5085 9.45324 16.2964 9.76165 15.988L18.0633 7.68631C18.942 6.80763 18.942 5.38301 18.0633 4.50433L17.0911 3.53206ZM14.9697 4.59272C15.2626 4.29982 15.7375 4.29982 16.0304 4.59272L17.0027 5.56499C17.2956 5.85788 17.2956 6.33276 17.0027 6.62565L16.1043 7.52402L14.0714 5.49109L14.9697 4.59272ZM13.0107 6.55175L6.66806 12.8944C6.56526 12.9972 6.49455 13.1277 6.46454 13.2699L5.96704 15.6283L8.32547 15.1308C8.46772 15.1008 8.59819 15.0301 8.70099 14.9273L15.0436 8.58468L13.0107 6.55175Z"
                          fill=""
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
