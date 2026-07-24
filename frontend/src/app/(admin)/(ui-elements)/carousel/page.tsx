import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SlideOnly from "@/components/ui/carousel/SlideOnly";
import WithControl from "@/components/ui/carousel/WithControl";
import WithControlAndIndicators from "@/components/ui/carousel/WithControlAndIndicators";
import WithIndicators from "@/components/ui/carousel/WithIndicators";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Carousel | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Carousel page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
  // other metadata
};

export default function Carousel() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Carousel" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:gap-6">
        <ComponentCard title="Slides Only">
          <SlideOnly />
        </ComponentCard>
        <ComponentCard title="With controls">
          <WithControl />
        </ComponentCard>
        <ComponentCard title="With indicators">
          <WithIndicators />
        </ComponentCard>
        <ComponentCard title="    With controls and indicators">
          <WithControlAndIndicators />
        </ComponentCard>
      </div>
    </div>
  );
}
