import ActivitiesCard from "@/components/saas/ActivitiesCard";
import ChurnRateChart from "@/components/saas/ChurnRate";
import FunnelChart from "@/components/saas/FunnelChart";
import GrowthChart from "@/components/saas/GrowthRate";
import ProductPerformanceTab from "@/components/saas/ProductPerformanceTab";
import SaasInvoiceTable from "@/components/saas/SaasInvoiceTable";
import SaasMetrics from "@/components/saas/SaasMetrics";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title:
    "Next.js SaaS Dashboard | TailAdmin - Next.js Admin Dashboard Template",
  description:
    "This is Next.js SaaS Dashboard page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function SaaS() {
  return (
    <div className="space-y-6">
      <SaasMetrics />

      <div className="gap-6 space-y-5 sm:space-y-6 xl:grid xl:grid-cols-12 xl:space-y-0">
        <div className="xl:col-span-7 2xl:col-span-8">
          <div className="space-y-5 sm:space-y-6">
            <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
              <ChurnRateChart />
              <GrowthChart />
            </div>

            {/* Funnel */}
            <FunnelChart />

            {/* Table */}
            <SaasInvoiceTable />
          </div>
        </div>
        <div className="space-y-5 sm:space-y-6 xl:col-span-5 2xl:col-span-4">
          {/* Product Performance */}
          <ProductPerformanceTab />

          {/* Activities */}
          <ActivitiesCard />
        </div>
      </div>
    </div>
  );
}
