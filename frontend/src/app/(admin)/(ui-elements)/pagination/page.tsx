import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PaginationExample from "@/components/ui/pagination/PaginationExample";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Pagination | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Pagination page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function Pagination() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Pagination" />
      <PaginationExample />
    </div>
  );
}
