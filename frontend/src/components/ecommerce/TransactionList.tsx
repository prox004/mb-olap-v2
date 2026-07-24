"use client";
import React, { useMemo } from "react";
import TableDropdown from "../common/TableDropdown";
import Link from "next/link";

interface Transaction {
  id: number;
  orderId: string;
  customer: string;
  email: string;
  amount: number;
  amountDisplay: string;
  status: "Completed" | "Pending" | "Failed";
  dueDate: string;
}

interface SortState {
  key: "customer" | "email" | "amount";
  asc: boolean;
}

const initialTransactions: Transaction[] = [
  {
    id: 1,
    orderId: "#323534",
    customer: "Lindsey Curtis",
    email: "lindsey@example.com",
    amount: 699,
    amountDisplay: "$699",
    status: "Completed",
    dueDate: "12 Feb, 2027",
  },
  {
    id: 2,
    orderId: "#323535",
    customer: "Kaiya George",
    email: "kaiya@example.com",
    amount: 1579,
    amountDisplay: "$1,579",
    status: "Failed",
    dueDate: "13 Mar, 2027",
  },
  {
    id: 3,
    orderId: "#323536",
    customer: "Zain Geidt",
    email: "zain787@example.com",
    amount: 1039,
    amountDisplay: "$1,039",
    status: "Pending",
    dueDate: "19 Mar, 2027",
  },
  {
    id: 4,
    orderId: "#323537",
    customer: "Abram Schleifer",
    email: "abram@example.com",
    amount: 43999,
    amountDisplay: "$43,999",
    status: "Completed",
    dueDate: "25 Apr, 2027",
  },
  {
    id: 5,
    orderId: "#323538",
    customer: "Carla George",
    email: "carla65@example.com",
    amount: 919,
    amountDisplay: "$919",
    status: "Completed",
    dueDate: "11 May, 2027",
  },
  {
    id: 6,
    orderId: "#323539",
    customer: "Emery Culhane",
    email: "emery09@example.com",
    amount: 839,
    amountDisplay: "$839",
    status: "Completed",
    dueDate: "29 Jun, 2027",
  },
  {
    id: 7,
    orderId: "#323540",
    customer: "Livia Donin",
    email: "livia343@example.com",
    amount: 1769,
    amountDisplay: "$1,769",
    status: "Failed",
    dueDate: "22 Jul, 2027",
  },
  {
    id: 8,
    orderId: "#323541",
    customer: "Miracle Bator",
    email: "miracle@example.com",
    amount: 7349,
    amountDisplay: "$7,349",
    status: "Completed",
    dueDate: "05 Aug, 2027",
  },
  {
    id: 9,
    orderId: "#323542",
    customer: "Lincoln Herwitz",
    email: "lincoln@example.com",
    amount: 849,
    amountDisplay: "$849",
    status: "Completed",
    dueDate: "09 Sep, 2027",
  },
  {
    id: 10,
    orderId: "#323543",
    customer: "Ekstrom Bothman",
    email: "ekstrom@example.com",
    amount: 679,
    amountDisplay: "$679",
    status: "Completed",
    dueDate: "15 Nov, 2027",
  },
  {
    id: 11,
    orderId: "#323544",
    customer: "Ava Smith",
    email: "ava.smith@example.com",
    amount: 1200,
    amountDisplay: "$1,200",
    status: "Pending",
    dueDate: "01 Dec, 2027",
  },
  {
    id: 12,
    orderId: "#323545",
    customer: "Noah Lee",
    email: "noah.lee@example.com",
    amount: 540,
    amountDisplay: "$540",
    status: "Failed",
    dueDate: "15 Dec, 2027",
  },
  {
    id: 13,
    orderId: "#323546",
    customer: "Mia Chen",
    email: "mia.chen@example.com",
    amount: 3200,
    amountDisplay: "$3,200",
    status: "Completed",
    dueDate: "22 Dec, 2027",
  },
  {
    id: 14,
    orderId: "#323547",
    customer: "Ethan Patel",
    email: "ethan.patel@example.com",
    amount: 2100,
    amountDisplay: "$2,100",
    status: "Pending",
    dueDate: "05 Jan, 2028",
  },
  {
    id: 15,
    orderId: "#323548",
    customer: "Sophia Kim",
    email: "sophia.kim@example.com",
    amount: 980,
    amountDisplay: "$980",
    status: "Completed",
    dueDate: "18 Jan, 2028",
  },
  {
    id: 16,
    orderId: "#323549",
    customer: "Liam Brown",
    email: "liam.brown@example.com",
    amount: 450,
    amountDisplay: "$450",
    status: "Failed",
    dueDate: "28 Jan, 2028",
  },
  {
    id: 17,
    orderId: "#323550",
    customer: "Olivia Wilson",
    email: "olivia.wilson@example.com",
    amount: 1750,
    amountDisplay: "$1,750",
    status: "Pending",
    dueDate: "10 Feb, 2028",
  },
  {
    id: 18,
    orderId: "#323551",
    customer: "Mason Clark",
    email: "mason.clark@example.com",
    amount: 600,
    amountDisplay: "$600",
    status: "Completed",
    dueDate: "20 Feb, 2028",
  },
  {
    id: 19,
    orderId: "#323552",
    customer: "Ella Davis",
    email: "ella.davis@example.com",
    amount: 210,
    amountDisplay: "$210",
    status: "Failed",
    dueDate: "01 Mar, 2028",
  },
  {
    id: 20,
    orderId: "#323553",
    customer: "James Martinez",
    email: "james.martinez@example.com",
    amount: 3300,
    amountDisplay: "$3,300",
    status: "Completed",
    dueDate: "15 Mar, 2028",
  },
];

const TransactionList: React.FC = () => {
  const [transactions] = React.useState<Transaction[]>(initialTransactions);
  const [selected, setSelected] = React.useState<number[]>([]);
  const [sort, setSort] = React.useState<SortState>({
    key: "customer",
    asc: true,
  });
  const [page, setPage] = React.useState<number>(1);
  const [search, setSearch] = React.useState<string>("");
  const [filterDays, setFilterDays] = React.useState<string>("Last 7 Days");
  const perPage: number = 10;

  const totalPages: number = Math.ceil(transactions.length / perPage) || 1;
  const startEntry: number =
    transactions.length === 0 ? 0 : (page - 1) * perPage + 1;
  const endEntry: number = Math.min(page * perPage, transactions.length);

  const sortedRows: Transaction[] = React.useMemo(() => {
    return [...transactions].sort((a, b) => {
      let valA = a[sort.key];
      let valB = b[sort.key];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sort.asc ? -1 : 1;
      if (valA > valB) return sort.asc ? 1 : -1;
      return 0;
    });
  }, [transactions, sort]);

  const filteredRows: Transaction[] = useMemo(() => {
    return sortedRows.filter(
      (row) =>
        row.orderId.toLowerCase().includes(search.toLowerCase()) ||
        row.customer.toLowerCase().includes(search.toLowerCase()) ||
        row.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [sortedRows, search]);

  const paginatedRows: Transaction[] = filteredRows.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const toggleSelectAll = (): void => {
    if (selected.length === paginatedRows.length) {
      setSelected([]);
    } else {
      setSelected(paginatedRows.map((row) => row.id));
    }
  };

  const updateSelectAll = (): void => {
    const allSelected = paginatedRows.every((row) => selected.includes(row.id));
    if (allSelected && selected.length !== paginatedRows.length) {
      setSelected(paginatedRows.map((row) => row.id));
    }
  };

  const toggleRow = (id: number): void => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    updateSelectAll();
  };

  const sortBy = (key: "customer" | "email" | "amount"): void => {
    setSort((prev) => ({
      key,
      asc: prev.key === key ? !prev.asc : true,
    }));
    setPage(1);
  };

  const goToPage = (n: number): void => {
    if (n >= 1 && n <= totalPages) setPage(n);
  };

  const handleViewMore = () => {
    //logic will be there
  };

  const handleDelete = () => {
    //logic will be there
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Transactions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your most recent transactions list
          </p>
        </div>
        <div className="flex gap-3.5">
          <div className="hidden flex-col gap-3 sm:flex sm:flex-row sm:items-center">
            <div className="relative">
              <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400">
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
                    d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                    fill=""
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search..."
                className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden xl:w-[300px] dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearch(e.target.value)
                }
              />
            </div>
            <div className="hidden lg:block">
              <select
                className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                value={filterDays}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFilterDays(e.target.value)
                }
              >
                <option>Last 7 Days</option>
                <option>Last 10 Days</option>
                <option>Last 15 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div>
              <button className="shadow-theme-xs flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M16.6661 13.3333V15.4166C16.6661 16.1069 16.1064 16.6666 15.4161 16.6666H4.58203C3.89168 16.6666 3.33203 16.1069 3.33203 15.4166V13.3333M10.0004 3.33325L10.0004 13.3333M6.14456 7.18708L9.9986 3.33549L13.8529 7.18708"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="custom-scrollbar overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="border-b border-gray-200 dark:divide-gray-800 dark:border-gray-800">
              <th className="p-4">
                <div className="flex w-full items-center gap-3">
                  <label className="flex cursor-pointer items-center text-sm font-medium text-gray-700 select-none dark:text-gray-400">
                    <span className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selected.length === paginatedRows.length}
                        onChange={toggleSelectAll}
                      />
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-sm border-[1.25px] ${
                          selected.length === paginatedRows.length
                            ? "border-brand-500 bg-brand-500"
                            : "bg-transparent border-gray-300 dark:border-gray-700"
                        }`}
                      >
                        <span
                          className={
                            selected.length === paginatedRows.length
                              ? ""
                              : "opacity-0"
                          }
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M10 3L4.5 8.5L2 6"
                              stroke="white"
                              strokeWidth="1.6666"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </span>
                    </span>
                  </label>
                  <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                    Order ID
                  </p>
                </div>
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                <div
                  className="flex cursor-pointer items-center gap-3"
                  onClick={() => sortBy("customer")}
                >
                  <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                    Customer
                  </p>
                  <span className="flex flex-col gap-0.5">
                    <svg
                      className={
                        sort.key === "customer" && sort.asc
                          ? "text-gray-800 dark:text-gray-400"
                          : "text-gray-300"
                      }
                      width="8"
                      height="5"
                      viewBox="0 0 8 5"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z"
                        fill="currentColor"
                      />
                    </svg>
                    <svg
                      className={
                        sort.key === "customer" && !sort.asc
                          ? "text-gray-800 dark:text-gray-400"
                          : "text-gray-300"
                      }
                      width="8"
                      height="5"
                      viewBox="0 0 8 5"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                </div>
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                <div
                  className="flex cursor-pointer items-center gap-3"
                  onClick={() => sortBy("email")}
                >
                  <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </p>
                  <span className="flex flex-col gap-0.5">
                    <svg
                      className={
                        sort.key === "email" && sort.asc
                          ? "text-gray-800 dark:text-gray-400"
                          : "text-gray-300"
                      }
                      width="8"
                      height="5"
                      viewBox="0 0 8 5"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z"
                        fill="currentColor"
                      />
                    </svg>
                    <svg
                      className={
                        sort.key === "email" && !sort.asc
                          ? "text-gray-800 dark:text-gray-400"
                          : "text-gray-300"
                      }
                      width="8"
                      height="5"
                      viewBox="0 0 8 5"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                </div>
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                <div
                  className="flex cursor-pointer items-center gap-3"
                  onClick={() => sortBy("amount")}
                >
                  <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                    Total Amount
                  </p>
                  <span className="flex flex-col gap-0.5">
                    <svg
                      className={
                        sort.key === "amount" && sort.asc
                          ? "text-gray-800 dark:text-gray-400"
                          : "text-gray-300"
                      }
                      width="8"
                      height="5"
                      viewBox="0 0 8 5"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z"
                        fill="currentColor"
                      />
                    </svg>
                    <svg
                      className={
                        sort.key === "amount" && !sort.asc
                          ? "text-gray-800 dark:text-gray-400"
                          : "text-gray-300"
                      }
                      width="8"
                      height="5"
                      viewBox="0 0 8 5"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                </div>
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Due Date
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                <div className="relative">
                  <span className="sr-only">Action</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-x divide-y divide-gray-200 dark:divide-gray-800">
            {paginatedRows.map((row: Transaction) => (
              <tr
                key={row.id}
                className="transition hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <td className="p-4 whitespace-nowrap">
                  <div className="group flex items-center gap-3">
                    <label className="flex cursor-pointer items-center text-sm font-medium text-gray-700 select-none dark:text-gray-400">
                      <span className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={selected.includes(row.id)}
                          onChange={() => toggleRow(row.id)}
                        />
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-sm border-[1.25px] ${
                            selected.includes(row.id)
                              ? "border-brand-500 bg-brand-500"
                              : "bg-transparent border-gray-300 dark:border-gray-700"
                          }`}
                        >
                          <span
                            className={
                              selected.includes(row.id) ? "" : "opacity-0"
                            }
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M10 3L4.5 8.5L2 6"
                                stroke="white"
                                strokeWidth="1.6666"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </span>
                      </span>
                    </label>
                    <Link
                      href="/single-transaction"
                      className="text-theme-xs font-medium text-gray-700 group-hover:underline dark:text-gray-400"
                    >
                      {row.orderId}
                    </Link>
                  </div>
                </td>
                <td className="p-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                    {row.customer}
                  </span>
                </td>
                <td className="p-4 whitespace-nowrap">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {row.email}
                  </p>
                </td>
                <td className="p-4 whitespace-nowrap">
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    {row.amountDisplay}
                  </p>
                </td>
                <td className="p-4 whitespace-nowrap">
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    {row.dueDate}
                  </p>
                </td>
                <td className="p-4 whitespace-nowrap">
                  <span
                    className={`text-theme-xs rounded-full px-2 py-0.5 font-medium ${
                      row.status === "Completed"
                        ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500"
                        : row.status === "Pending"
                        ? "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500"
                        : "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-500"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="p-4 whitespace-nowrap">
                  <div className="relative inline-block">
                    <TableDropdown
                      dropdownButton={
                        <button className="text-gray-500 dark:text-gray-400 ">
                          <svg
                            className="fill-current"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M5.99902 10.245C6.96552 10.245 7.74902 11.0285 7.74902 11.995V12.005C7.74902 12.9715 6.96552 13.755 5.99902 13.755C5.03253 13.755 4.24902 12.9715 4.24902 12.005V11.995C4.24902 11.0285 5.03253 10.245 5.99902 10.245ZM17.999 10.245C18.9655 10.245 19.749 11.0285 19.749 11.995V12.005C19.749 12.9715 18.9655 13.755 17.999 13.755C17.0325 13.755 16.249 12.9715 16.249 12.005V11.995C16.249 11.0285 17.0325 10.245 17.999 10.245ZM13.749 11.995C13.749 11.0285 12.9655 10.245 11.999 10.245C11.0325 10.245 10.249 11.0285 10.249 11.995V12.005C10.249 12.9715 11.0325 13.755 11.999 13.755C12.9655 13.755 13.749 12.9715 13.749 12.005V11.995Z"
                              fill=""
                            />
                          </svg>
                        </button>
                      }
                      dropdownContent={
                        <>
                          <button
                            onClick={handleViewMore}
                            className="text-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            View More
                          </button>
                          <button
                            onClick={handleDelete}
                            className="text-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            Delete
                          </button>
                        </>
                      }
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-800">
        <div className="flex justify-center pb-4 sm:hidden">
          <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
            Showing{" "}
            <span className="text-gray-800 dark:text-white/90">
              {startEntry}
            </span>{" "}
            to{" "}
            <span className="text-gray-800 dark:text-white/90">{endEntry}</span>{" "}
            of{" "}
            <span className="text-gray-800 dark:text-white/90">
              {filteredRows.length}
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="hidden sm:block">
            <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="text-gray-800 dark:text-white/90">
                {startEntry}
              </span>{" "}
              to{" "}
              <span className="text-gray-800 dark:text-white/90">
                {endEntry}
              </span>{" "}
              of{" "}
              <span className="text-gray-800 dark:text-white/90">
                {filteredRows.length}
              </span>
            </span>
          </div>
          <div className="flex w-full items-center justify-between gap-2 rounded-lg bg-gray-50 p-4 sm:w-auto sm:justify-normal sm:rounded-none sm:bg-transparent sm:p-0 dark:bg-gray-900 dark:sm:bg-transparent">
            <button
              className={`shadow-theme-xs flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 hover:text-gray-800 sm:p-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 ${
                page === 1 ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={page === 1}
              onClick={() => page > 1 && setPage(page - 1)}
            >
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
                  d="M2.58203 9.99868C2.58174 10.1909 2.6549 10.3833 2.80152 10.53L7.79818 15.5301C8.09097 15.8231 8.56584 15.8233 8.85883 15.5305C9.15183 15.2377 9.152 14.7629 8.85921 14.4699L5.13911 10.7472L16.6665 10.7472C17.0807 10.7472 17.4165 10.4114 17.4165 9.99715C17.4165 9.58294 17.0807 9.24715 16.6665 9.24715L5.14456 9.24715L8.85919 5.53016C9.15199 5.23717 9.15184 4.7623 8.85885 4.4695C8.56587 4.1767 8.09099 4.17685 7.79819 4.46984L2.84069 9.43049C2.68224 9.568 2.58203 9.77087 2.58203 9.99715C2.58203 9.99766 2.58203 9.99817 2.58203 9.99868Z"
                  fill=""
                />
              </svg>
            </button>
            <span className="block text-sm font-medium text-gray-700 sm:hidden dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <ul className="hidden items-center gap-0.5 sm:flex">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <li key={n}>
                  <button
                    onClick={() => goToPage(n)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                      page === n
                        ? "bg-brand-500 text-white"
                        : "text-gray-700 hover:bg-brand-500 hover:text-white dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    {n}
                  </button>
                </li>
              ))}
            </ul>
            <button
              className={`shadow-theme-xs flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 hover:text-gray-800 sm:p-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 ${
                page === totalPages ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={page === totalPages}
              onClick={() => page < totalPages && setPage(page + 1)}
            >
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
                  d="M17.4165 9.9986C17.4168 10.1909 17.3437 10.3832 17.197 10.53L12.2004 15.5301C11.9076 15.8231 11.4327 15.8233 11.1397 15.5305C10.8467 15.2377 10.8465 14.7629 11.1393 14.4699L14.8594 10.7472L3.33203 10.7472C2.91782 10.7472 2.58203 10.4114 2.58203 9.99715C2.58203 9.58294 2.91782 9.24715 3.33203 9.24715L14.854 9.24715L11.1393 5.53016C10.8465 5.23717 10.8467 4.7623 11.1397 4.4695C11.4327 4.1767 11.9075 4.17685 12.2003 4.46984L17.1578 9.43049C17.3163 9.568 17.4165 9.77087 17.4165 9.99715C17.4165 9.99763 17.4165 9.99812 17.4165 9.9986Z"
                  fill=""
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionList;
