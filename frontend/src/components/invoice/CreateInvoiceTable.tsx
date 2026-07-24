"use client";
import { useState } from "react";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { ChevronDownIcon } from "@/icons";

interface Product {
  name: string;
  price: number;
  quantity: number;
  discount: number;
  total: string;
}

interface FormData {
  name: string;
  price: number;
  quantity: number;
  discount: number;
}

const CreateInvoiceTable: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([
    {
      name: "Macbook pro 13”",
      price: 1200,
      quantity: 1,
      discount: 0,
      total: (1200 * 1).toFixed(2),
    },
    {
      name: "Apple Watch Ultra",
      price: 300,
      quantity: 1,
      discount: 50,
      total: (300 * 1 * 0.5).toFixed(2),
    },
    {
      name: "iPhone 15 Pro Max",
      price: 800,
      quantity: 2,
      discount: 0,
      total: (800 * 2).toFixed(2),
    },
    {
      name: "iPad Pro 3rd Gen",
      price: 900,
      quantity: 1,
      discount: 0,
      total: (900 * 1).toFixed(2),
    },
  ]);

  const [form, setForm] = useState<FormData>({
    name: "",
    price: 0,
    quantity: 1,
    discount: 0,
  });

  const handleDelete = (index: number): void => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "quantity" || name === "discount"
          ? Number(value)
          : value,
    }));
  };

  const handleQuantityChange = (delta: number): void => {
    setForm((prev) => ({
      ...prev,
      quantity: Math.max(1, prev.quantity + delta),
    }));
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (form.name && form.price > 0) {
      const total = (
        form.price *
        form.quantity *
        (1 - form.discount / 100)
      ).toFixed(2);
      setProducts((prev) => [...prev, { ...form, total }]);
      setForm({
        name: "",
        price: 0,
        quantity: 1,
        discount: 0,
      });
    }
  };

  const subtotal: number = products.reduce(
    (sum, product) => sum + Number(product.total),
    0
  );
  const vat: number = subtotal * 0.1;
  const total: number = subtotal + vat;

  return (
    <div className="space-y-6">
      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
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
                <th className="relative px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-white/[0.03]">
              {products.map((product, idx) => (
                <tr key={idx}>
                  <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {idx + 1}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-800 dark:text-white/90">
                    {product.name}
                  </td>
                  <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {product.quantity}
                  </td>
                  <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                    ${product.price}
                  </td>
                  <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {product.discount}%
                  </td>
                  <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                    ${product.total}
                  </td>
                  <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center">
                      <svg
                        className="hover:fill-error-500 dark:hover:fill-error-500 cursor-pointer fill-gray-700 dark:fill-gray-400"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        onClick={() => handleDelete(idx)}
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M6.54142 3.7915C6.54142 2.54886 7.54878 1.5415 8.79142 1.5415H11.2081C12.4507 1.5415 13.4581 2.54886 13.4581 3.7915V4.0415H15.6252H16.666C17.0802 4.0415 17.416 4.37729 17.416 4.7915C17.416 5.20572 17.0802 5.5415 16.666 5.5415H16.3752V8.24638V13.2464V16.2082C16.3752 17.4508 15.3678 18.4582 14.1252 18.4582H5.87516C4.63252 18.4582 3.62516 17.4508 3.62516 16.2082V13.2464V8.24638V5.5415H3.3335C2.91928 5.5415 2.5835 5.20572 2.5835 4.7915C2.5835 4.37729 2.91928 4.0415 3.3335 4.0415H4.37516H6.54142V3.7915ZM14.8752 13.2464V8.24638V5.5415H13.4581H12.7081H7.29142H6.54142H5.12516V8.24638V13.2464V16.2082C5.12516 16.6224 5.46095 16.9582 5.87516 16.9582H14.1252C14.5394 16.9582 14.8752 16.6224 14.8752 16.2082V13.2464ZM8.04142 4.0415H11.9581V3.7915C11.9581 3.37729 11.6223 3.0415 11.2081 3.0415H8.79142C8.37721 3.0415 8.04142 3.37729 8.04142 3.7915V4.0415ZM8.3335 7.99984C8.74771 7.99984 9.0835 8.33562 9.0835 8.74984V13.7498C9.0835 14.1641 8.74771 14.4998 8.3335 14.4998C7.91928 14.4998 7.5835 14.1641 7.5835 13.7498V8.74984C7.5835 8.33562 7.91928 7.99984 8.3335 7.99984ZM12.4168 8.74984C12.4168 8.33562 12.081 7.99984 11.6668 7.99984C11.2526 7.99984 10.9168 8.33562 10.9168 8.74984V13.7498C10.9168 14.1641 11.2526 14.4998 11.6668 14.4998C12.081 14.4998 12.4168 14.1641 12.4168 13.7498V8.74984Z"
                          fill=""
                        />
                      </svg>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="px-5 py-4 text-center text-gray-400">
              No products added.
            </div>
          )}
        </div>
      </div>

      {/* Add Product Form */}
      <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:p-6 dark:border-gray-800 dark:bg-gray-900">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-12">
            <div className="w-full lg:col-span-3">
              <Label>Product Name</Label>
              <Input
                type="text"
                name="name"
                defaultValue={form.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
              />
            </div>
            <div className="w-full lg:col-span-3">
              <Label>Price</Label>
              <Input
                type="number"
                name="price"
                defaultValue={form.price || ""}
                onChange={handleInputChange}
                min="0"
                placeholder="Enter product price"
              />
            </div>
            <div className="w-full lg:col-span-2">
              <Label>Quantity</Label>
              <div className="flex h-11 divide-x divide-gray-300 overflow-hidden rounded-lg border border-gray-300 dark:divide-gray-800 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  className="inline-flex w-1/3 items-center justify-center bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                  <svg
                    width="25"
                    height="24"
                    viewBox="0 0 25 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.66699 12H18.6677"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div className="w-1/3">
                  <input
                    type="number"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleInputChange}
                    min="1"
                    className="h-full w-full border-0 bg-white text-center text-sm text-gray-700 outline-none focus:ring-0 dark:bg-gray-900 dark:text-gray-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  className="inline-flex w-1/3 items-center justify-center bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                  <svg
                    width="25"
                    height="24"
                    viewBox="0 0 25 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.66699 12.0002H18.6677M12.6672 6V18.0007"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="w-full lg:col-span-2">
              <Label>Discount</Label>
              <div className="relative">
                <select
                  name="discount"
                  value={form.discount}
                  onChange={handleInputChange}
                  className="dark:bg-dark-900 bg-none appearance-none shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                >
                  <option value="0">0%</option>
                  <option value="10">10%</option>
                  <option value="20">20%</option>
                  <option value="50">50%</option>
                </select>
                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                  <ChevronDownIcon />
                </span>
              </div>
            </div>
            <div className="flex w-full items-end lg:col-span-2">
              <button
                type="submit"
                className="hover:bg-brand-600 bg-brand-500 h-11 w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition"
              >
                Save Product
              </button>
            </div>
          </div>
        </form>
        <div className="mt-5 flex max-w-2xl items-center gap-2">
          <svg
            className="text-gray-500 dark:text-gray-400"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 7.22485H10.0007"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.0004 9.34575V12.8661M17.7087 10.0001C17.7087 14.2573 14.2575 17.7084 10.0003 17.7084C5.74313 17.7084 2.29199 14.2573 2.29199 10.0001C2.29199 5.74289 5.74313 2.29175 10.0003 2.29175C14.2575 2.29175 17.7087 5.74289 17.7087 10.0001Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            After filling in the product details, press Enter/Return or click
            &apos;Save Product&apos; to add it to the list.
          </p>
        </div>
      </div>

      {/* Total Summary */}
      <div className="flex flex-wrap justify-between sm:justify-end">
        <div className=" w-full space-y-1 text-right sm:w-[220px]">
          <p className="mb-4 text-left text-sm font-medium text-gray-800 dark:text-white/90">
            Order summary
          </p>
          <ul className="space-y-2">
            <li className="flex justify-between gap-5">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Sub Total
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                ${subtotal.toFixed(2)}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Vat (10%):
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                ${vat.toFixed(2)}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-400">
                Total
              </span>
              <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
                ${total.toFixed(2)}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoiceTable;
