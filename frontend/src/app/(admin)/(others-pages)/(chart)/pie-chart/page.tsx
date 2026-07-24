import PieChartOne from "@/components/charts/pie/PieChartOne";
import PieChartTwo from "@/components/charts/pie/PieChartTwo";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Pie Chart | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Pie Chart page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function PieChart() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Pie Chart" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ComponentCard title="Pie Chart 1">
          <PieChartOne />
        </ComponentCard>
        <ComponentCard title="Pie Chart 2">
          <PieChartTwo />
        </ComponentCard>
      </div>
    </div>
  );
}
