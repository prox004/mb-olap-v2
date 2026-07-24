import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ProductListTable from "@/components/ecommerce/ProductListTable";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js E-commerce Products | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js E-commerce Products TailAdmin Dashboard Template",
};

export default function ProductPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Products" />
      <ProductListTable />
    </div>
  );
}
