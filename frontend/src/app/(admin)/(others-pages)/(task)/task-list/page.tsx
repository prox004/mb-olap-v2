import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import React from "react";
import { Metadata } from "next";
import TaskList from "@/components/task/task-list/TaskList";

export const metadata: Metadata = {
  title: "Next.js Task List | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Task List page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
  // other metadata
};

export default function TaskListPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Task List" />
      <TaskList />
    </div>
  );
}
