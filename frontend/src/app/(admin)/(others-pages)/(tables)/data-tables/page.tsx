import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import DataTableTwo from "@/components/tables/DataTables/TableTwo/DataTableTwo";
import DataTableOne from "@/components/tables/DataTables/TableOne/DataTableOne";
import DataTableThree from "@/components/tables/DataTables/TableThree/DataTableThree";

import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Advanced Data Table | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Advanced Data Table page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function DataTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Data Tables" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Data Table 1">
          <DataTableOne />
        </ComponentCard>
        <ComponentCard title="Data Table 2">
          <DataTableTwo />
        </ComponentCard>
        <ComponentCard title="Data Table 3">
          <DataTableThree />
        </ComponentCard>
      </div>
    </div>
  );
}
