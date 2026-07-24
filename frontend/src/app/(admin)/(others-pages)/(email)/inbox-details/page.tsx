import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import EmailWrapper from "@/components/email/EmailDetails/EmailWrapper";
import EmailSidebar from "@/components/email/EmailSidebar/EmailSidebar";

import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Inbox Details | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Inbox Details page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function InboxDetails() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Inbox Details" />
      <div className="sm:h-[calc(100vh-174px)] xl:h-[calc(100vh-186px)]">
        <div className="xl:grid xl:grid-cols-12 flex flex-col gap-5 sm:gap-5">
          <div className="xl:col-span-3 col-span-full">
            <EmailSidebar />
          </div>
          <div className="xl:col-span-9 w-full">
            <EmailWrapper />
          </div>
        </div>
      </div>
    </div>
  );
}
