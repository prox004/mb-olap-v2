import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CustomerDetails from "@/components/transactions/CustomerDetails";
import OrderDetailsTable from "@/components/transactions/OrderDetailsTable";
import OrderHistory from "@/components/transactions/OrderHistory";
import TransactionHeader from "@/components/transactions/TransactionHeader";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Next.js E-commerce Single Transaction | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js E-commerce Single Transaction TailAdmin Dashboard Template",
};

export default function SingleTransactionPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Single Transaction" />
      <div className="space-y-6">
        <TransactionHeader />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 2xl:col-span-9">
            <OrderDetailsTable />
          </div>
          <div className="space-y-6 lg:col-span-4 2xl:col-span-3">
            <CustomerDetails />
            <OrderHistory />
          </div>
        </div>
      </div>
    </div>
  );
}
