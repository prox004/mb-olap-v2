"use client";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

interface Row {
  id: string;
  category: string;
  company: string;
  arrival: string;
  route: string;
  price: string;
  status: string;
  statusClass: string;
}

interface Sort {
  column: string;
  asc: boolean;
}

const initialRows: Row[] = [
  {
    id: "#324112",
    category: "Furniture",
    company: "HomeLine",
    arrival: "10 Apr 2028 2:15 pm",
    route: "Berlin–Milan",
    price: "$1,250.00",
    status: "Delivered",
    statusClass:
      "bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-500 text-xs rounded-full px-2 py-0.5 font-medium",
  },
  {
    id: "#325678",
    category: "Clothing",
    company: "StylePro",
    arrival: "21 May 2028 9:00 am",
    route: "Paris–Rome",
    price: "$340.75",
    status: "Delivered",
    statusClass:
      "bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-500 text-xs rounded-full px-2 py-0.5 font-medium",
  },
  {
    id: "#326789",
    category: "Books",
    company: "EduSource",
    arrival: "02 Jun 2028 11:45 am",
    route: "New York–Chicago",
    price: "$128.40",
    status: "In Transit",
    statusClass:
      "bg-warning-50 dark:bg-warning-500/15 text-warning-600 dark:text-warning-400 text-xs rounded-full px-2 py-0.5 font-medium",
  },
  {
    id: "#327003",
    category: "Automotive",
    company: "AutoParts Co.",
    arrival: "18 Mar 2028 4:00 pm",
    route: "Tokyo–Osaka",
    price: "$2,150.89",
    status: "Delivered",
    statusClass:
      "bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-500 text-xs rounded-full px-2 py-0.5 font-medium",
  },
  {
    id: "#328556",
    category: "Electronics",
    company: "TechNova",
    arrival: "25 Jul 2028 10:30 am",
    route: "San Francisco–Seattle",
    price: "$849.99",
    status: "Delivered",
    statusClass:
      "bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-500 text-xs rounded-full px-2 py-0.5 font-medium",
  },
  {
    id: "#329101",
    category: "Health",
    company: "MediCorp",
    arrival: "30 May 2028 3:00 pm",
    route: "Toronto–Vancouver",
    price: "$579.20",
    status: "Delivered",
    statusClass:
      "bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-500 text-xs rounded-full px-2 py-0.5 font-medium",
  },
  {
    id: "#330212",
    category: "Toys",
    company: "FunTime",
    arrival: "07 Jun 2028 1:15 pm",
    route: "Sydney–Melbourne",
    price: "$212.65",
    status: "Delivered",
    statusClass:
      "bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-500 text-xs rounded-full px-2 py-0.5 font-medium",
  },
  {
    id: "#331145",
    category: "Kitchen",
    company: "CookWell",
    arrival: "13 May 2028 12:30 pm",
    route: "Madrid–Barcelona",
    price: "$489.90",
    status: "Delivered",
    statusClass:
      "bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-500 text-xs rounded-full px-2 py-0.5 font-medium",
  },
  {
    id: "#332800",
    category: "Beauty",
    company: "GlamShine",
    arrival: "28 Jun 2028 5:45 pm",
    route: "Dubai–Doha",
    price: "$323.75",
    status: "Canceled",
    statusClass:
      "text-xs rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-600 dark:bg-red-500/15 dark:text-red-500",
  },
  {
    id: "#333902",
    category: "Sports",
    company: "FitZone",
    arrival: "19 Jul 2028 8:00 am",
    route: "Los Angeles–Las Vegas",
    price: "$489.90",
    status: "$675.00",
    statusClass:
      "bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-500 text-xs rounded-full px-2 py-0.5 font-medium",
  },
];

const DeliveryActivityTable: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>("All");
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [rows] = useState<Row[]>(initialRows);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>({ column: "", asc: true });
  const [page, setPage] = useState<number>(1);
  const perPage: number = 5;

  const totalPages: number = Math.ceil(rows.length / perPage);
  const startRow: number = (page - 1) * perPage;
  const endRow: number = page * perPage;

  const toggleAll = (): void => {
    if (selectedRows.length === rows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(rows.map((r) => r.id));
    }
  };

  const toggleRow = (id: string): void => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const sortBy = (col: string): void => {
    setSort((prev) => ({
      column: prev.column === col ? col : col,
      asc: prev.column === col ? !prev.asc : true,
    }));
  };

  const prevPage = (): void => {
    if (page > 1) setPage(page - 1);
  };

  const nextPage = (): void => {
    if (page < totalPages) setPage(page + 1);
  };

  const goToPage = (n: number): void => {
    setPage(n);
  };

  const getPaginatedRows = (): Row[] => {
    const sorted: Row[] = [...rows];
    if (sort.column) {
      sorted.sort((a: Row, b: Row) => {
        const valA = a[sort.column as keyof Row];
        const valB = b[sort.column as keyof Row];
        if (sort.column === "arrival") {
          return (
            (Number(new Date(valA)) - Number(new Date(valB))) *
            (sort.asc ? 1 : -1)
          );
        }
        if (valA < valB) return sort.asc ? -1 : 1;
        if (valA > valB) return sort.asc ? 1 : -1;
        return 0;
      });
    }
    return sorted.slice(startRow, endRow);
  };

  const paginatedRows: Row[] = getPaginatedRows();

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between dark:border-gray-800">
        <div className="">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Delivery Activities
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track your recent shipping activities
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row lg:items-center">
          <div className="inline-flex h-11 flex-1 w-full gap-0.5 overflow-x-auto rounded-lg bg-gray-100 p-0.5 sm:w-auto lg:min-w-fit dark:bg-gray-900">
            {["All", "Delivered", "In-Transit", "Pending", "Processing"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`h-10 flex-1 rounded-md px-2 py-2 text-xs font-medium sm:px-3 sm:text-sm lg:flex-initial ${
                    selectedTab === tab
                      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>
          <div className="relative">
            <button
              className="shadow-theme-xs flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 sm:w-auto sm:min-w-[100px] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              onClick={() => setShowFilter(!showFilter)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M14.6537 5.90414C14.6537 4.48433 13.5027 3.33331 12.0829 3.33331C10.6631 3.33331 9.51206 4.48433 9.51204 5.90415M14.6537 5.90414C14.6537 7.32398 13.5027 8.47498 12.0829 8.47498C10.663 8.47498 9.51204 7.32398 9.51204 5.90415M14.6537 5.90414L17.7087 5.90411M9.51204 5.90415L2.29199 5.90411M5.34694 14.0958C5.34694 12.676 6.49794 11.525 7.91777 11.525C9.33761 11.525 10.4886 12.676 10.4886 14.0958M5.34694 14.0958C5.34694 15.5156 6.49794 16.6666 7.91778 16.6666C9.33761 16.6666 10.4886 15.5156 10.4886 14.0958M5.34694 14.0958L2.29199 14.0958M10.4886 14.0958L17.7087 14.0958"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Filter
            </button>
            {showFilter && (
              <div className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-5">
                  <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <input
                    type="text"
                    className="shadow-theme-xs h-10 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                    placeholder="Search category..."
                  />
                </div>
                <div className="mb-5">
                  <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Company
                  </label>
                  <input
                    type="text"
                    className="shadow-theme-xs h-10 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                    placeholder="Search company..."
                  />
                </div>
                <button className="bg-brand-500 hover:bg-brand-600 h-10 w-full rounded-lg px-3 py-2 text-sm font-medium text-white">
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div>
        <div className="custom-scrollbar overflow-x-auto">
          <Table className="w-full table-auto">
            <TableHeader>
              <TableRow className="border-b border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                <TableCell isHeader className="p-4">
                  <div className="flex w-full cursor-pointer items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <label className="flex cursor-pointer items-center text-sm font-medium text-gray-700 select-none dark:text-gray-400">
                          <span className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              onChange={toggleAll}
                              checked={selectedRows.length === rows.length}
                            />
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-sm border-[1.25px] ${
                                selectedRows.length === rows.length
                                  ? "border-brand-500 bg-brand-500"
                                  : "bg-transparent border-gray-300 dark:border-gray-700"
                              }`}
                            >
                              <span
                                className={
                                  selectedRows.length === rows.length
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
                      </div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Order ID
                      </p>
                    </div>
                  </div>
                </TableCell>
                {["category", "company", "arrival"].map((col) => (
                  <th
                    key={col}
                    className="cursor-pointer p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                    onClick={() => sortBy(col)}
                  >
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {col.charAt(0).toUpperCase() +
                          col.slice(1).replace("arrival", "Arrival Time")}
                      </p>
                      <span className="flex flex-col gap-0.5">
                        <svg
                          className={
                            sort.column === col && sort.asc
                              ? "text-gray-500"
                              : "text-gray-300"
                          }
                          width="8"
                          height="5"
                          viewBox="0 0 8 5"
                          fill="none"
                        >
                          <path
                            d="M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z"
                            fill="currentColor"
                          />
                        </svg>
                        <svg
                          className={
                            sort.column === col && !sort.asc
                              ? "text-gray-500"
                              : "text-gray-300"
                          }
                          width="8"
                          height="5"
                          viewBox="0 0 8 5"
                          fill="none"
                        >
                          <path
                            d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z"
                            fill="currentColor"
                          />
                        </svg>
                      </span>
                    </div>
                  </th>
                ))}
                <TableCell
                  isHeader
                  className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Route
                </TableCell>
                <TableCell
                  isHeader
                  className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Price
                </TableCell>
                <TableCell
                  isHeader
                  className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Status
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-x divide-y divide-gray-200 dark:divide-gray-800">
              {paginatedRows.map((row) => (
                <TableRow
                  key={row.id}
                  className="transition hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <TableCell className="p-4 whitespace-nowrap">
                    <div className="group flex items-center gap-3">
                      <div>
                        <label className="flex cursor-pointer items-center text-sm font-medium text-gray-700 select-none dark:text-gray-400">
                          <span className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              onChange={() => toggleRow(row.id)}
                              checked={selectedRows.includes(row.id)}
                            />
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-sm border-[1.25px] ${
                                selectedRows.includes(row.id)
                                  ? "border-brand-500 bg-brand-500"
                                  : "bg-transparent border-gray-300 dark:border-gray-700"
                              }`}
                            >
                              <span
                                className={
                                  selectedRows.includes(row.id)
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
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-400">
                        {row.id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="p-4 text-sm font-normal whitespace-nowrap text-gray-800 dark:text-white/90">
                    {row.category}
                  </TableCell>
                  <TableCell className="p-4 text-sm font-normal whitespace-nowrap text-gray-700 dark:text-white/90">
                    {row.company}
                  </TableCell>
                  <TableCell className="p-4 text-sm font-normal whitespace-nowrap text-gray-700 dark:text-white/90">
                    {row.arrival}
                  </TableCell>
                  <TableCell className="p-4 text-sm font-normal whitespace-nowrap text-gray-700 dark:text-white/90">
                    {row.route}
                  </TableCell>
                  <TableCell className="p-4 text-sm font-normal whitespace-nowrap text-gray-700 dark:text-white/90">
                    {row.price}
                  </TableCell>
                  <TableCell className="p-4 whitespace-nowrap">
                    <span className={row.statusClass}>{row.status}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center flex-col sm:flex-row justify-between border-t border-gray-200 px-5 py-4 dark:border-gray-800">
          <div className="pb-3 sm:pb-0">
            <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="text-gray-800 dark:text-white/90">
                {startRow + 1}
              </span>{" "}
              to{" "}
              <span className="text-gray-800 dark:text-white/90">
                {Math.min(endRow, rows.length)}
              </span>{" "}
              of{" "}
              <span className="text-gray-800 dark:text-white/90">
                {rows.length}
              </span>
            </span>
          </div>
          <div className="flex items-center bg-gray-50 dark:bg-white/[0.03] p-4 sm:p-0 sm:bg-transparent rounded-lg dark:sm:bg-transparent w-full sm:w-auto justify-between gap-2 sm:justify-normal">
            <button
              onClick={prevPage}
              disabled={page === 1}
              className="shadow-theme-xs flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 sm:p-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
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
                />
              </svg>
            </button>
            <span className="block text-sm font-medium text-gray-700 sm:hidden dark:text-gray-400">
              Page <span>{page}</span> of <span>{totalPages}</span>
            </span>
            <ul className="hidden items-center gap-0.5 sm:flex">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <li key={n}>
                  <a
                    href="#"
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      goToPage(n);
                    }}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                      page === n
                        ? "bg-brand-500 text-white"
                        : "text-gray-700 dark:text-gray-400 hover:bg-brand-500 hover:text-white dark:hover:text-white"
                    }`}
                  >
                    {n}
                  </a>
                </li>
              ))}
            </ul>
            <button
              onClick={nextPage}
              disabled={page === totalPages}
              className="shadow-theme-xs flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 sm:p-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
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
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryActivityTable;
