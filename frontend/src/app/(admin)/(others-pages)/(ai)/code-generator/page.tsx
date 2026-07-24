import AiLayout from "@/components/ai/AiLayout";
import AiPageBreadcrumb from "@/components/ai/AiPageBreadcrumb";
import CodeGeneratorContent from "@/components/ai/CodeGeneratorContent";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title:
    "Next.js AI Code Generator | TailAdmin - Next.js Admin Dashboard Template",
  description:
    "This is Next.js AI Code Generator page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function CodeGeneratorPage() {
  return (
    <div>
      <AiPageBreadcrumb pageTitle="Code Generator" />
      <AiLayout>
        <CodeGeneratorContent />
      </AiLayout>
    </div>
  );
}
