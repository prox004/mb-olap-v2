import ChatBox from "@/components/chats/ChatBox";
import ChatSidebar from "@/components/chats/ChatSidebar";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Messages | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Messages page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
  // other metadata
};

export default function Chat() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Chats" />
      <div className="h-[calc(100vh-150px)] overflow-hidden sm:h-[calc(100vh-174px)]">
        <div className="flex flex-col h-full gap-6 xl:flex-row xl:gap-5">
          {/* <!-- Chat Sidebar Start --> */}
          <ChatSidebar />
          {/* <!-- Chat Sidebar End --> */}
          {/* <!-- Chat Box Start --> */}
          <ChatBox />
          {/* <!-- Chat Box End --> */}
        </div>
      </div>
    </div>
  );
}