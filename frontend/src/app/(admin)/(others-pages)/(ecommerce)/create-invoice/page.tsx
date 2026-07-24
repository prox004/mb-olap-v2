import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import InvoicePreviewModal from "@/components/ecommerce/invoices/InvoicePreviewModal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import CreateInvoiceTable from "@/components/invoice/CreateInvoiceTable";
import Button from "@/components/ui/button/Button";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title:
    "Next.js E-commerce  Create Invoice Page | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js E-commerce  Create Invoice Page TailAdmin Dashboard Template",
};

export default function CreateInvoicePage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Create Invoice" />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-xl font-medium text-gray-800 dark:text-white">
            Create Invoice
          </h2>
        </div>
        <div className="border-b border-gray-200 p-4 sm:p-8 dark:border-gray-800">
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label>Invoice Number</Label>
                <Input placeholder="WP-3434434" />
              </div>{" "}
              <div>
                <Label>Customer Name</Label>
                <Input placeholder="John Deniyal" />
              </div>{" "}
              <div className="col-span-full">
                <Label>Customer Address</Label>
                <Input placeholder="Enter customer address" />
              </div>{" "}
            </div>
          </form>
        </div>
        <div className="border-b border-gray-200 p-4 sm:p-8 dark:border-gray-800">
          <CreateInvoiceTable />
        </div>
        <div className="p-4 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <InvoicePreviewModal />
            <Button variant="primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M13.333 16.6666V12.9166C13.333 12.2262 12.7734 11.6666 12.083 11.6666L7.91634 11.6666C7.22599 11.6666 6.66634 12.2262 6.66634 12.9166L6.66635 16.6666M9.99967 5.83325H6.66634M15.4163 16.6666H4.58301C3.89265 16.6666 3.33301 16.1069 3.33301 15.4166V4.58325C3.33301 3.8929 3.89265 3.33325 4.58301 3.33325H12.8171C13.1483 3.33325 13.4659 3.46468 13.7003 3.69869L16.2995 6.29384C16.5343 6.52832 16.6662 6.84655 16.6662 7.17841L16.6663 15.4166C16.6663 16.1069 16.1066 16.6666 15.4163 16.6666Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Save Invoice
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
