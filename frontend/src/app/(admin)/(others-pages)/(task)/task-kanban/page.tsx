import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import KanbanBoard from "@/components/task/kanban/KanbanBoard";
import TaskHeader from "@/components/task/TaskHeader";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title:
    "Task Kanban Dashboard | TailAdmin - Tailwind CSS Admin Dashboard Template",
  description: "Tailwind Admin Dashboard",
};

export default function TaskKanban() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Task Kanban" />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <TaskHeader />
        <KanbanBoard />
      </div>
    </div>
  );
}
