import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import RibbonExample from "@/components/ui/ribbons";

import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Ribbons | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Spinners page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function Ribbons() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Ribbons" />
      <RibbonExample />
    </div>
  );
}
