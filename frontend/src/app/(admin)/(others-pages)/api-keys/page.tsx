import ApiKeyTable from "@/components/api-keys/ApiKeyTable";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js API Keys Page | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js API Keys Page TailAdmin Dashboard Template",
};

export default function ApiKeysPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="API Keys" />
      <ApiKeyTable />
    </div>
  );
}
