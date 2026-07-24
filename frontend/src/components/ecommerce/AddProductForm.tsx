"use client";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import TextArea from "../form/input/TextArea";
import Button from "../ui/button/Button";

export default function AddProductForm() {
  const categories = [
    { value: "Laptop", label: "Laptop" },
    { value: "Phone", label: "Phone" },
    { value: "Watch", label: "Watch" },
    { value: "Electronics", label: "Electronics" },
    { value: "Accessories", label: "Accessories" },
  ];
  const brands = [
    { value: "1", label: "Apple" },
    { value: "2", label: "Samsung" },
    { value: "3", label: "LG" },
  ];
  const availability = [
    { value: "1", label: "In Stock" },
    { value: "2", label: "Out of Stock" },
  ];
  const colors = [
    { value: "1", label: "Silver" },
    { value: "2", label: "Black" },
    { value: "3", label: "White" },
    { value: "4", label: "Gray" },
  ];
  const handleSelectChange = (value: string) => {
    console.log("Selected value:", value);
  };
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Products Description
          </h2>
        </div>
        <div className="p-4 sm:p-6 dark:border-gray-800">
          <form>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label>Product Name</Label>
                <Input placeholder="Enter product name" />
              </div>{" "}
              <div>
                <Label>Category</Label>
                <Select
                  options={categories}
                  placeholder="Select a category"
                  onChange={handleSelectChange}
                  defaultValue=""
                />
              </div>
              <div>
                <Label>Brand</Label>
                <Select
                  options={brands}
                  placeholder="Select brand"
                  onChange={handleSelectChange}
                  defaultValue=""
                />
              </div>{" "}
              <div>
                <Label>Color</Label>
                <Select
                  options={colors}
                  placeholder="Select color"
                  onChange={handleSelectChange}
                  defaultValue=""
                />
              </div>
              <div className="col-span-full">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div>
                    <Label>Weight(KG)</Label>
                    <Input type="number" placeholder="15" />
                  </div>{" "}
                  <div>
                    <Label>Length(CM)</Label>
                    <Input type="number" placeholder="120" />
                  </div>{" "}
                  <div>
                    <Label>Width(CM)</Label>
                    <Input type="number" placeholder="23" />
                  </div>
                  <div className="col-span-full">
                    <Label>Description</Label>
                    <TextArea rows={6} placeholder="Receipt Info (optional)" />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Pricing & Availability
          </h2>
        </div>
        <div className="space-y-5 p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <Label>Weight(KG)</Label>
              <Input type="number" placeholder="15" />
            </div>{" "}
            <div>
              <Label>Length(CM)</Label>
              <Input type="number" placeholder="120" />
            </div>{" "}
            <div>
              <Label>Width(CM)</Label>
              <Input type="number" placeholder="23" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1 inline-block text-sm font-semibold text-gray-700 dark:text-gray-400">
                Stock Quantity
              </label>
              <div className="flex h-11 divide-x divide-gray-300 overflow-hidden rounded-lg border border-gray-300 dark:divide-gray-800 dark:border-gray-700">
                <button className="inline-flex h-11 w-11 items-center justify-center bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="25"
                    height="24"
                    viewBox="0 0 25 24"
                    fill="none"
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
                <div className="flex-1">
                  <input
                    type="text"
                    className="h-full w-full border-0 bg-white text-center text-sm text-gray-700 outline-none focus:ring-0 dark:bg-gray-900 dark:text-gray-400"
                  />
                </div>
                <button className="inline-flex h-11 w-11 items-center justify-center bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="25"
                    height="24"
                    viewBox="0 0 25 24"
                    fill="none"
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
            <div>
              <Label> Availability Status</Label>
              <Select
                options={availability}
                placeholder="Select a Availability"
                onChange={handleSelectChange}
                defaultValue=""
              />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Products Images
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          <label
            htmlFor="product-image"
            className="shadow-theme-xs group hover:border-brand-500 block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 transition dark:hover:border-brand-400 dark:border-gray-800"
          >
            <div className="flex justify-center p-10">
              <div className="flex max-w-[260px] flex-col items-center gap-4">
                <div className="inline-flex h-13 w-13 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition dark:border-gray-800 dark:text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M20.0004 16V18.5C20.0004 19.3284 19.3288 20 18.5004 20H5.49951C4.67108 20 3.99951 19.3284 3.99951 18.5V16M12.0015 4L12.0015 16M7.37454 8.6246L11.9994 4.00269L16.6245 8.6246"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Click to upload
                  </span>
                  or drag and drop SVG, PNG, JPG or GIF (MAX. 800x400px)
                </p>
              </div>
            </div>
            <input type="file" id="product-image" className="hidden" />
          </label>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline">Draft</Button>
        <Button variant="primary">Publish Product</Button>
      </div>
    </div>
  );
}
