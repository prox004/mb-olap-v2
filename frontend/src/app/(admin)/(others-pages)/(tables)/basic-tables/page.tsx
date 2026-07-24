import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import BasicTableFive from "@/components/tables/BasicTables/BasicTableFive";
import BasicTableFour from "@/components/tables/BasicTables/BasicTableFour";
import BasicTableOne from "@/components/tables/BasicTables/BasicTableOne";
import BasicTableThree from "@/components/tables/BasicTables/BasicTableThree";
import BasicTableTwo from "@/components/tables/BasicTables/BasicTableTwo";

import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Basic Data Table | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Basic Data Table page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function BasicTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Basic Tables" />
      <div className="space-y-6">
        <ComponentCard title="Basic Table 1">
          <BasicTableOne />
        </ComponentCard>
        <ComponentCard title="Basic Table 2">
          <BasicTableTwo />
        </ComponentCard>
        <ComponentCard title="Basic Table 3">
          <BasicTableThree />
        </ComponentCard>
        <ComponentCard title="Basic Table 4">
          <BasicTableFour />
        </ComponentCard>
        <ComponentCard title="Basic Table 5">
          <BasicTableFive />
        </ComponentCard>
      </div>
    </div>
  );
}
