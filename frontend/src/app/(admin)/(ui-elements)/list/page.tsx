import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import HorizontalList from "@/components/ui/list/HorizontalList";
import ListWithButton from "@/components/ui/list/ListWithButton";
import ListWithCheckbox from "@/components/ui/list/ListWithCheckbox";
import ListWithIcon from "@/components/ui/list/ListWithIcon";
import ListWithRadio from "@/components/ui/list/ListWithRadio";
import OrderedList from "@/components/ui/list/OrderedList";
import UnOrderedList from "@/components/ui/list/UnorderedList";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js List | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js List page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function List() {
  return (
    <div>
      <PageBreadcrumb pageTitle="List" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:gap-6">
        <ComponentCard title="Unordered List">
          <UnOrderedList />
        </ComponentCard>
        <ComponentCard title="Ordered List">
          <OrderedList />
        </ComponentCard>
        <ComponentCard title="List With button">
          <ListWithButton />
        </ComponentCard>
        <ComponentCard title="List With Icon">
          <ListWithIcon />
        </ComponentCard>
        <div className="col-span-2">
          <ComponentCard title="Horizontal List">
            <HorizontalList />
          </ComponentCard>
        </div>
        <ComponentCard title="List with checkbox">
          <ListWithCheckbox />
        </ComponentCard>
        <ComponentCard title="List with radio">
          <ListWithRadio />
        </ComponentCard>
      </div>
    </div>
  );
}
