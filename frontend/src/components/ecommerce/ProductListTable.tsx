"use client";
import React, { useState } from "react";

import Button from "../ui/button/Button";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: number;
  name: string;
  image: string;
  category: string;
  brand: string;
  price: string;
  stock: string;
  createdAt: string;
}

interface Sort {
  key: keyof Product;
  asc: boolean;
}

const FilterDropdown: React.FC<{
  showFilter: boolean;
  setShowFilter: (show: boolean) => void;
}> = ({ showFilter, setShowFilter }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setShowFilter(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [setShowFilter]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="shadow-theme-xs flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 sm:w-auto sm:min-w-[100px] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
        onClick={() => setShowFilter(!showFilter)}
        type="button"
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
              className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              placeholder="Search category..."
            />
          </div>
          <div className="mb-5">
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Customer
            </label>
            <input
              type="text"
              className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              placeholder="Search customer..."
            />
          </div>
          <button className="bg-brand-500 hover:bg-brand-600 h-10 w-full rounded-lg px-3 py-2 text-sm font-medium text-white">
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

const ProductListTable: React.FC = () => {
  const [products] = useState<Product[]>([
    {
      id: 1,
      name: "Macbook pro M4",
      image: "/images/product/product-01.jpg",
      category: "Laptop",
      brand: "Apple",
      price: "$699",
      stock: "In Stock",
      createdAt: "12 Feb, 2027",
    },
    {
      id: 2,
      name: "Apple Watch Ultra",
      image: "/images/product/product-02.jpg",
      category: "Watch",
      brand: "Apple",
      price: "$1,579",
      stock: "Out of Stock",
      createdAt: "13 Mar, 2027",
    },
    {
      id: 3,
      name: "iPhone 15 Pro Max",
      image: "/images/product/product-03.jpg",
      category: "Phone",
      brand: "Apple",
      price: "$1,039",
      stock: "In Stock",
      createdAt: "19 Mar, 2027",
    },
    {
      id: 4,
      name: "iPad Pro 3rd Gen",
      image: "/images/product/product-04.jpg",
      category: "Electronics",
      brand: "Apple",
      price: "$43,999",
      stock: "In Stock",
      createdAt: "25 Apr, 2027",
    },
    {
      id: 5,
      name: "Samsung Galaxy S24 Ultra",
      image: "/images/product/product-05.jpg",
      category: "Phone",
      brand: "Samsung",
      price: "$699",
      stock: "In Stock",
      createdAt: "11 May, 2027",
    },
    {
      id: 6,
      name: "Airpods Pro 2nd Gen",
      image: "/images/product/product-01.jpg",
      category: "Accessories",
      brand: "Apple",
      price: "$839",
      stock: "In Stock",
      createdAt: "29 Jun, 2027",
    },
    {
      id: 7,
      name: "LG OLED & 4K Smart TV",
      image: "/images/product/product-02.jpg",
      category: "Electronics",
      brand: "LG",
      price: "$1,769",
      stock: "Out of Stock",
      createdAt: "22 Jul, 2027",
    },
    {
      id: 8,
      name: "Sony WH-1000XM5 Headphones",
      image: "/images/product/product-03.jpg",
      category: "Audio",
      brand: "Sony",
      price: "$399",
      stock: "In Stock",
      createdAt: "05 Aug, 2027",
    },
    {
      id: 9,
      name: "Dell XPS 13 Laptop",
      image: "/images/product/product-04.jpg",
      category: "Laptop",
      brand: "Dell",
      price: "$1,299",
      stock: "In Stock",
      createdAt: "18 Aug, 2027",
    },
    {
      id: 10,
      name: "Google Pixel 8 Pro",
      image: "/images/product/product-05.jpg",
      category: "Phone",
      brand: "Google",
      price: "$899",
      stock: "Out of Stock",
      createdAt: "02 Sep, 2027",
    },
    {
      id: 11,
      name: "Microsoft Surface Pro 9",
      image: "/images/product/product-01.jpg",
      category: "Tablet",
      brand: "Microsoft",
      price: "$1,099",
      stock: "In Stock",
      createdAt: "15 Sep, 2027",
    },
    {
      id: 12,
      name: "Canon EOS R5 Camera",
      image: "/images/product/product-02.jpg",
      category: "Camera",
      brand: "Canon",
      price: "$3,899",
      stock: "In Stock",
      createdAt: "28 Sep, 2027",
    },
    {
      id: 13,
      name: "Nintendo Switch OLED",
      image: "/images/product/product-03.jpg",
      category: "Gaming",
      brand: "Nintendo",
      price: "$349",
      stock: "Out of Stock",
      createdAt: "10 Oct, 2027",
    },
    {
      id: 14,
      name: "Razer DeathAdder V3 Mouse",
      image: "/images/product/product-04.jpg?v=2",
      category: "Accessories",
      brand: "Razer",
      price: "$89",
      stock: "In Stock",
      createdAt: "23 Oct, 2027",
    },
    {
      id: 15,
      name: "HP Envy 34 Monitor",
      image: "/images/product/product-05.jpg",
      category: "Monitor",
      brand: "HP",
      price: "$799",
      stock: "In Stock",
      createdAt: "05 Nov, 2027",
    },
    {
      id: 16,
      name: "Bose QuietComfort Earbuds",
      image: "/images/product/product-01.jpg",
      category: "Audio",
      brand: "Bose",
      price: "$279",
      stock: "In Stock",
      createdAt: "18 Nov, 2027",
    },
    {
      id: 17,
      name: "ASUS ROG Gaming Laptop",
      image: "/images/product/product-03.jpg",
      category: "Laptop",
      brand: "ASUS",
      price: "$2,199",
      stock: "Out of Stock",
      createdAt: "01 Dec, 2027",
    },
    {
      id: 18,
      name: "Logitech MX Master 3S",
      image: "/images/product/product-04.jpg",
      category: "Accessories",
      brand: "Logitech",
      price: "$119",
      stock: "In Stock",
      createdAt: "14 Dec, 2027",
    },
    {
      id: 19,
      name: "Steam Deck OLED",
      image: "/images/product/product-02.jpg",
      category: "Gaming",
      brand: "Valve",
      price: "$649",
      stock: "In Stock",
      createdAt: "27 Dec, 2027",
    },
    {
      id: 20,
      name: "Samsung 980 Pro SSD 2TB",
      image: "/images/product/product-03.jpg",
      category: "Storage",
      brand: "Samsung",
      price: "$299",
      stock: "In Stock",
      createdAt: "09 Jan, 2028",
    },
  ]);
  const [selected, setSelected] = useState<number[]>([]);
  const [sort, setSort] = useState<Sort>({ key: "name", asc: true });
  const [page, setPage] = useState(1);
  const [perPage] = useState(7);
  const [showFilter, setShowFilter] = useState(false);

  const sortedProducts = () => {
    return [...products].sort((a, b) => {
      let valA = a[sort.key];
      let valB = b[sort.key];
      if (sort.key === "price") {
        valA = parseFloat(String(valA).replace(/[^\d.]/g, ""));
        valB = parseFloat(String(valB).replace(/[^\d.]/g, ""));
      }
      if (valA < valB) return sort.asc ? -1 : 1;
      if (valA > valB) return sort.asc ? 1 : -1;
      return 0;
    });
  };

  const paginatedProducts = () => {
    const start = (page - 1) * perPage;
    return sortedProducts().slice(start, start + perPage);
  };

  const totalPages = () => Math.ceil(products.length / perPage);

  const goToPage = (n: number) => {
    if (n >= 1 && n <= totalPages()) setPage(n);
  };

  const prevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const nextPage = () => {
    if (page < totalPages()) setPage(page + 1);
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    const ids = paginatedProducts().map((p) => p.id);
    setSelected((prev) =>
      isAllSelected()
        ? prev.filter((id) => !ids.includes(id))
        : [...new Set([...prev, ...ids])]
    );
  };

  const isAllSelected = () => {
    const ids = paginatedProducts().map((p) => p.id);
    return ids.length > 0 && ids.every((id) => selected.includes(id));
  };

  const startItem = () => {
    return products.length === 0 ? 0 : (page - 1) * perPage + 1;
  };

  const endItem = () => {
    return Math.min(page * perPage, products.length);
  };

  const sortBy = (key: keyof Product) => {
    setSort((prev) => ({
      key,
      asc: prev.key === key ? !prev.asc : true,
    }));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col justify-between gap-5 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Products List
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track your store&apos;s progress to boost your sales.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline">
            Export
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M16.667 13.3333V15.4166C16.667 16.1069 16.1074 16.6666 15.417 16.6666H4.58295C3.89259 16.6666 3.33295 16.1069 3.33295 15.4166V13.3333M10.0013 13.3333L10.0013 3.33325M6.14547 9.47942L9.99951 13.331L13.8538 9.47942"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
          <Link
            href="/add-product"
            className="bg-brand-500 shadow-sm hover inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M5 10.0002H15.0006M10.0002 5V15.0006"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Add Product
          </Link>
        </div>
      </div>
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <div className="flex gap-3 sm:justify-between">
          <div className="relative flex-1 sm:flex-auto">
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
                  d="M3.04199 9.37336937363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                  fill=""
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search..."
              className="shadow-sm focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-none sm:w-[300px] sm:min-w-[300px] dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
            />
          </div>
          <FilterDropdown
            showFilter={showFilter}
            setShowFilter={setShowFilter}
          />
        </div>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:divide-gray-800 dark:border-gray-800">
              <th className="w-14 px-5 py-4 text-left">
                <label className="cursor-pointer text-sm font-medium text-gray-700 select-none dark:text-gray-400">
                  <input
                    type="checkbox"
                    className="sr-only"
                    onChange={toggleAll}
                    checked={isAllSelected()}
                  />
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-sm border-[1.25px] ${
                      isAllSelected()
                        ? "border-brand-500 bg-brand-500"
                        : "bg-transparent border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <span className={isAllSelected() ? "" : "opacity-0"}>
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
                </label>
              </th>
              <th
                onClick={() => sortBy("name")}
                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                <div className="flex items-center gap-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Products
                  </p>
                  <span className="flex flex-col gap-0.5">
                    <svg
                      className={
                        sort.key === "name" && sort.asc
                          ? "text-gray-500 dark:text-gray-400"
                          : "text-gray-300 dark:text-gray-400/50"
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
                        sort.key === "name" && !sort.asc
                          ? "text-gray-500 dark:text-gray-400"
                          : "text-gray-300 dark:text-gray-400/50"
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
              <th
                onClick={() => sortBy("category")}
                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                <div className="flex items-center gap-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Category
                  </p>
                  <span className="flex flex-col gap-0.5">
                    <svg
                      className={
                        sort.key === "category" && sort.asc
                          ? "text-gray-500 dark:text-gray-400"
                          : "text-gray-300 dark:text-gray-400/50"
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
                        sort.key === "category" && !sort.asc
                          ? "text-gray-500 dark:text-gray-400"
                          : "text-gray-300 dark:text-gray-400/50"
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
              <th
                onClick={() => sortBy("brand")}
                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                <div className="flex items-center gap-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Brand
                  </p>
                  <span className="flex flex-col gap-0.5">
                    <svg
                      className={
                        sort.key === "brand" && sort.asc
                          ? "text-gray-500 dark:text-gray-400"
                          : "text-gray-300 dark:text-gray-400/50"
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
                        sort.key === "brand" && !sort.asc
                          ? "text-gray-500 dark:text-gray-400"
                          : "text-gray-300 dark:text-gray-400/50"
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
              <th
                onClick={() => sortBy("price")}
                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                <div className="flex items-center gap-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Price
                  </p>
                  <span className="flex flex-col gap-0.5">
                    <svg
                      className={
                        sort.key === "price" && sort.asc
                          ? "text-gray-500 dark:text-gray-400"
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
                        sort.key === "price" && !sort.asc
                          ? "text-gray-500 dark:text-gray-400"
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
              <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Stock
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Created At
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                <div className="relative">
                  <span className="sr-only">Action</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-x divide-y divide-gray-200 dark:divide-gray-800">
            {paginatedProducts().map((product) => (
              <tr
                key={product.id}
                className="transition hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <td className="w-14 px-5 py-4 whitespace-nowrap">
                  <label className="cursor-pointer text-sm font-medium text-gray-700 select-none dark:text-gray-400">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selected.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                    />
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-sm border-[1.25px] ${
                        selected.includes(product.id)
                          ? "border-brand-500 bg-brand-500"
                          : "bg-transparent border-gray-300 dark:border-gray-700"
                      }`}
                    >
                      <span
                        className={
                          selected.includes(product.id) ? "" : "opacity-0"
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
                  </label>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12">
                      <Image
                        width={48}
                        height={48}
                        src={product.image}
                        className="h-12 w-12 rounded-md"
                        alt=""
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                      {product.name}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {product.category}
                  </p>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    {product.brand}
                  </p>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    {product.price}
                  </p>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                      product.stock === "In Stock"
                        ? "bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-500"
                        : "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-500"
                    }`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    {product.createdAt}
                  </p>
                </td>
                <td className="px-5 py-4 whitespace-nowrap"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center flex-col sm:flex-row justify-between border-t border-gray-200 px-5 py-4 dark:border-gray-800">
        <div className="pb-3 sm:pb-0">
          <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
            Showing{" "}
            <span className="text-gray-800 dark:text-white/90">
              {startItem()}
            </span>{" "}
            to{" "}
            <span className="text-gray-800 dark:text-white/90">
              {endItem()}
            </span>{" "}
            of{" "}
            <span className="text-gray-800 dark:text-white/90">
              {products.length}
            </span>
          </span>
        </div>
        <div className="flex w-full items-center justify-between gap-2 rounded-lg bg-gray-50 p-4 sm:w-auto sm:justify-normal sm:rounded-none sm:bg-transparent sm:p-0 dark:bg-gray-900 dark:sm:bg-transparent">
          <button
            onClick={prevPage}
            disabled={page === 1}
            className="shadow-sm flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:p-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
          >
            <span>
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
            </span>
          </button>
          <span className="block text-sm font-medium text-gray-700 sm:hidden dark:text-gray-400">
            Page <span>{page}</span> of <span>{totalPages()}</span>
          </span>
          <ul className="hidden items-center gap-0.5 sm:flex">
            {Array.from({ length: totalPages() }, (_, i) => i + 1).map((n) => (
              <li key={n}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goToPage(n);
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                    page === n
                      ? "bg-brand-500 text-white"
                      : "text-gray-700 dark:text-gray-400 hover:bg-brand-500 hover:text-white dark:hover:text-white"
                  }`}
                >
                  <span>{n}</span>
                </a>
              </li>
            ))}
          </ul>
          <button
            onClick={nextPage}
            disabled={page === totalPages()}
            className="shadow-sm flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:p-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
          >
            <span>
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
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductListTable;
