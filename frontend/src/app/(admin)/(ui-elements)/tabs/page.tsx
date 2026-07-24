import ComponentCard from "@/components/common/ComponentCard";
import DefaultTab from "@/components/ui/tabs/DefaultTab";
import TabWithBadge from "@/components/ui/tabs/TabWithBadge";
import TabWithUnderline from "@/components/ui/tabs/TabWithUnderline";
import TabWithUnderlineAndIcon from "@/components/ui/tabs/TabWithUnderlineAndIcon";
import VerticalTabs from "@/components/ui/tabs/VerticalTabs";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Tabs | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Tabs page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
  // other metadata
};

export default function Tabs() {
  return (
    <div>
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Default Tab">
          <DefaultTab />
        </ComponentCard>
        <ComponentCard title="Tab With Underline">
          <TabWithUnderline />
        </ComponentCard>
        <ComponentCard title="Tab with line and icon">
          <TabWithUnderlineAndIcon />
        </ComponentCard>
        <ComponentCard title="Tab with badge">
          <TabWithBadge />
        </ComponentCard>
        <ComponentCard title="Vertical Tab">
          <VerticalTabs />
        </ComponentCard>
      </div>
    </div>
  );
}
