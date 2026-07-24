"use client";
import { useState } from "react";

interface Invoice {
  id: number;
  name: string;
  date: string;
  price: string;
  plan: string;
  status: string;
}

const initialInvoices: Invoice[] = [
  {
    id: 1,
    name: "Invoice #012 - May 2024",
    date: "May 01, 2024",
    price: "$120.00",
    plan: "Starter Plan",
    status: "Paid",
  },
  {
    id: 2,
    name: "Invoice #013 - June 2024",
    date: "June 01, 2024",
    price: "$120.00",
    plan: "Starter Plan",
    status: "Paid",
  },
  {
    id: 3,
    name: "Invoice #014 - July 2024",
    date: "July 01, 2024",
    price: "$120.00",
    plan: "Starter Plan",
    status: "Unpaid",
  },
  {
    id: 4,
    name: "Invoice #015 - August 2024",
    date: "August 01, 2024",
    price: "$250.00",
    plan: "Pro Plan",
    status: "Paid",
  },
  {
    id: 5,
    name: "Invoice #016 - September 2024",
    date: "September 01, 2024",
    price: "$250.00",
    plan: "Pro Plan",
    status: "Paid",
  },
  {
    id: 6,
    name: "Invoice #017 - October 2024",
    date: "October 01, 2024",
    price: "$250.00",
    plan: "Pro Plan",
    status: "Unpaid",
  },
  {
    id: 7,
    name: "Invoice #018 - November 2024",
    date: "November 01, 2024",
    price: "$500.00",
    plan: "Enterprise Plan",
    status: "Paid",
  },
  {
    id: 8,
    name: "Invoice #019 - December 2024",
    date: "December 01, 2024",
    price: "$500.00",
    plan: "Enterprise Plan",
    status: "Paid",
  },
  {
    id: 9,
    name: "Invoice #020 - January 2025",
    date: "January 01, 2025",
    price: "$500.00",
    plan: "Enterprise Plan",
    status: "Unpaid",
  },
  {
    id: 10,
    name: "Invoice #021 - February 2025",
    date: "February 01, 2025",
    price: "$500.00",
    plan: "Enterprise Plan",
    status: "Paid",
  },
  {
    id: 11,
    name: "Invoice #022 - March 2025",
    date: "March 01, 2025",
    price: "$120.00",
    plan: "Starter Plan",
    status: "Paid",
  },
  {
    id: 12,
    name: "Invoice #023 - April 2025",
    date: "April 01, 2025",
    price: "$120.00",
    plan: "Starter Plan",
    status: "Unpaid",
  },
];

const InvoiceTable: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [invoices] = useState<Invoice[]>(initialInvoices);
  const itemsPerPage: number = 5;

  const totalInvoices: number = invoices.length;
  const totalPages: number = Math.ceil(totalInvoices / itemsPerPage);
  const startItem: number = (currentPage - 1) * itemsPerPage + 1;
  const endItem: number = Math.min(currentPage * itemsPerPage, totalInvoices);

  const paginatedInvoices: Invoice[] = invoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const visiblePages = (): number[] => {
    const maxVisible: number = 5;
    let start: number = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end: number = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const goToPage = (page: number): void => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = (): void => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = (): void => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-6">
        <div className="flex flex-col justify-between gap-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Invoices
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Access all your previous invoices.
            </p>
          </div>
          <div>
            <button
              type="button"
              className="shadow-theme-xs flex w-full justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="20"
                viewBox="0 0 21 20"
                fill="none"
              >
                <path
                  d="M17.1661 13.333V15.4163C17.1661 16.1067 16.6064 16.6663 15.9161 16.6663H5.08203C4.39168 16.6663 3.83203 16.1067 3.83203 15.4163V13.333M10.5004 13.333L10.5005 3.33301M6.64456 9.47918L10.4986 13.3308L14.3529 9.47918"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Download All
            </button>
          </div>
        </div>
      </div>
      <div>
        <div className="custom-scrollbar overflow-x-auto px-6">
          <table className="min-w-full">
            <thead>
              <tr className="border-y border-gray-200 dark:border-gray-800">
                <th className="px-6 py-3 text-left text-sm font-normal text-gray-500 first:pl-0 dark:text-gray-400">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-normal text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-normal text-gray-500 dark:text-gray-400">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-sm font-normal text-gray-500 dark:text-gray-400">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-sm font-normal text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-sm font-normal text-gray-500 dark:text-gray-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {paginatedInvoices.map((invoice: Invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-3 text-left whitespace-nowrap first:pl-0">
                    <div className="flex gap-3 pl-2">
                      <svg
                        className="h-8 w-7"
                        xmlns="http://www.w3.org/2000/svg"
                        width="21"
                        height="24"
                        viewBox="0 0 21 24"
                        fill="none"
                      >
                        <path
                          d="M4.8125 0.625C4.03047 0.625 3.39062 1.26484 3.39062 2.04688V21.9531C3.39062 22.7352 4.03047 23.375 4.8125 23.375H19.0312C19.8133 23.375 20.4531 22.7352 20.4531 21.9531V6.3125L14.7656 0.625H4.8125Z"
                          fill="#E2E5E7"
                        />
                        <path
                          d="M16.1875 6.3125H20.4531L14.7656 0.625V4.89062C14.7656 5.67266 15.4055 6.3125 16.1875 6.3125Z"
                          fill="#B0B7BD"
                        />
                        <path
                          d="M20.4531 10.5781L16.1875 6.3125H20.4531V10.5781Z"
                          fill="#CAD1D8"
                        />
                        <path
                          d="M17.6094 19.1094C17.6094 19.5004 17.2895 19.8203 16.8984 19.8203H1.25781C0.866797 19.8203 0.546875 19.5004 0.546875 19.1094V12C0.546875 11.609 0.866797 11.2891 1.25781 11.2891H16.8984C17.2895 11.2891 17.6094 11.609 17.6094 12V19.1094Z"
                          fill="#F15642"
                        />
                        <path
                          d="M3.64648 14.0956C3.64648 13.9079 3.79436 13.7031 4.03252 13.7031H5.34562C6.085 13.7031 6.75044 14.1979 6.75044 15.1463C6.75044 16.045 6.085 16.5455 5.34562 16.5455H4.39652V17.2962C4.39652 17.5465 4.23727 17.6879 4.03252 17.6879C3.84484 17.6879 3.64648 17.5465 3.64648 17.2962V14.0956ZM4.39652 14.419V15.8352H5.34562C5.72669 15.8352 6.02812 15.499 6.02812 15.1463C6.02812 14.7489 5.72669 14.419 5.34562 14.419H4.39652Z"
                          fill="white"
                        />
                        <path
                          d="M7.86314 17.6875C7.67545 17.6875 7.4707 17.5851 7.4707 17.3356V14.1065C7.4707 13.9025 7.67545 13.7539 7.86314 13.7539H9.16487C11.7626 13.7539 11.7058 17.6875 9.21605 17.6875H7.86314ZM8.22145 14.4478V16.9944H9.16487C10.6998 16.9944 10.768 14.4478 9.16487 14.4478H8.22145Z"
                          fill="white"
                        />
                        <path
                          d="M12.6284 14.494V15.3976H14.078C14.2828 15.3976 14.4875 15.6023 14.4875 15.8007C14.4875 15.9884 14.2828 16.1419 14.078 16.1419H12.6284V17.3356C12.6284 17.5347 12.4869 17.6875 12.2879 17.6875C12.0376 17.6875 11.8848 17.5347 11.8848 17.3356V14.1065C11.8848 13.9025 12.0383 13.7539 12.2879 13.7539H14.2835C14.5337 13.7539 14.6816 13.9025 14.6816 14.1065C14.6816 14.2885 14.5337 14.4933 14.2835 14.4933H12.6284V14.494Z"
                          fill="white"
                        />
                        <path
                          d="M16.8984 19.8203H3.39062V20.5312H16.8984C17.2895 20.5312 17.6094 20.2113 17.6094 19.8203V19.1094C17.6094 19.5004 17.2895 19.8203 16.8984 19.8203Z"
                          fill="#CAD1D8"
                        />
                      </svg>
                      <p className="text-sm font-normal text-gray-700 dark:text-gray-400">
                        {invoice.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm font-normal whitespace-nowrap text-gray-700 dark:text-gray-400">
                    {invoice.date}
                  </td>
                  <td className="px-6 py-3 text-sm font-normal whitespace-nowrap text-gray-700 dark:text-gray-400">
                    {invoice.price}
                  </td>
                  <td className="px-6 py-3 text-sm font-normal whitespace-nowrap text-gray-700 dark:text-gray-400">
                    {invoice.plan}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium ${
                        invoice.status === "Paid"
                          ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                          : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="shadow-theme-xs inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="21"
                          height="20"
                          viewBox="0 0 21 20"
                          fill="none"
                        >
                          <path
                            d="M17.1661 13.333V15.4163C17.1661 16.1067 16.6064 16.6663 15.9161 16.6663H5.08203C4.39168 16.6663 3.83203 16.1067 3.83203 15.4163V13.333M10.5004 13.333L10.5004 3.33301M6.64456 9.47918L10.4986 13.3308L14.3529 9.47918"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button className="shadow-theme-xs inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="21"
                          height="20"
                          viewBox="0 0 21 20"
                          fill="none"
                        >
                          <path
                            d="M2.96487 10.7925C2.73306 10.2899 2.73306 9.71023 2.96487 9.20764C4.28084 6.35442 7.15966 4.375 10.4993 4.375C13.8389 4.375 16.7178 6.35442 18.0337 9.20765C18.2655 9.71024 18.2655 10.2899 18.0337 10.7925C16.7178 13.6458 13.8389 15.6252 10.4993 15.6252C7.15966 15.6252 4.28084 13.6458 2.96487 10.7925Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M13.5202 10C13.5202 11.6684 12.1677 13.0208 10.4993 13.0208C8.83099 13.0208 7.47852 11.6684 7.47852 10C7.47852 8.33164 8.83099 6.97917 10.4993 6.97917C12.1677 6.97917 13.5202 8.33164 13.5202 10Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
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
        <div className="rounded-b-xl border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex justify-center">
            <div className="block pb-4 text-sm text-gray-700 sm:hidden dark:text-gray-400">
              Showing <span>{startItem}</span> to <span>{endItem}</span> of{" "}
              <span>{totalInvoices}</span> invoices
            </div>
          </div>
          <div className="flex items-center justify-between gap-8 bg-gray-50 dark:bg-white/[0.03] p-4 rounded-lg sm:bg-transparent dark:sm:bg-transparent sm:p-0">
            <button
              onClick={previousPage}
              disabled={currentPage === 1}
              className={`shadow-theme-xs flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-700 sm:px-3.5 sm:py-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 ${
                currentPage === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50 hover:text-gray-800 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              }`}
            >
              <svg
                className="fill-current"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M2.58203 9.99868C2.58174 10.1909 2.6549 10.3833 2.80152 10.53L7.79818 15.5301C8.09097 15.8231 8.56584 15.8233 8.85883 15.5305C9.15183 15.2377 9.152 14.7629 8.85921 14.4699L5.13911 10.7472L16.6665 10.7472C17.0807 10.7472 17.4165 10.4114 17.4165 9.99715C17.4165 9.58294 17.0807 9.24715 16.6665 9.24715L5.14456 9.24715L8.85919 5.53016C9.15199 5.23717 9.15184 4.7623 8.85885 4.4695C8.56587 4.1767 8.09099 4.17685 7.79819 4.46984L2.84069 9.43049C2.68224 9.568 2.58203 9.77087 2.58203 9.99715C2.58203 9.99766 2.58203 9.99817 2.58203 9.99868Z"
                />
              </svg>
              <span className="hidden sm:inline">Previous</span>
            </button>
            <span className="block text-sm font-medium text-gray-700 sm:hidden dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <ul className="hidden items-center gap-0.5 sm:flex">
              {visiblePages().map((page: number) => (
                <li key={page}>
                  <button
                    onClick={() => goToPage(page)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                      currentPage === page
                        ? "bg-brand-500 text-white hover:bg-brand-500 hover:text-white"
                        : "text-gray-700 hover:bg-brand-500 hover:text-white dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`shadow-theme-xs flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-700 sm:px-3.5 sm:py-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 ${
                currentPage === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50 hover:text-gray-800 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <svg
                className="fill-current"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M17.4165 9.9986C17.4168 10.1909 17.3437 10.3832 17.197 10.53L12.2004 15.5301C11.9076 15.8231 11.4327 15.8233 11.1397 15.5305C10.8467 15.2377 10.8465 14.7629 11.1393 14.4699L14.8594 10.7472L3.33203 10.7472C2.91782 10.7472 2.58203 10.4114 2.58203 9.99715C2.58203 9.58294 2.91782 9.24715 3.33203 9.24715L14.854 9.24715L11.1393 5.53016C10.8465 5.23717 10.8467 4.7623 11.1397 4.4695C11.4327 4.1767 11.9075 4.17685 12.2003 4.46984L17.1578 9.43049C17.3163 9.568 17.4165 9.77087 17.4165 9.99715C17.4165 9.99763 17.4165 9.99812 17.4165 9.9986Z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTable;
