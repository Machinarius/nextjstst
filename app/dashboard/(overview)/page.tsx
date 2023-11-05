import React from "react";
import { lusitana } from "@ui/fonts";
import RevenueChart from "@ui/dashboard/revenue-chart";
import LatestInvoices from "@ui/dashboard/latest-invoices";
import CardWrapper, { Card } from "@ui/dashboard/cards";
import { CardsSkeleton, LatestInvoicesSkeleton, RevenueChartSkeleton } from "@/app/ui/skeletons";

// The page.tsx file is automatically rendered by NextJS as the content of the route
export default async function DashboardPage() {
  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <React.Suspense fallback={<CardsSkeleton />}>
          <CardWrapper />
        </React.Suspense>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <React.Suspense fallback={<RevenueChartSkeleton />}>
          <RevenueChart />
        </React.Suspense>
        <React.Suspense fallback={<LatestInvoicesSkeleton />}>
          <LatestInvoices />
        </React.Suspense>
      </div>
    </main>
  );
}
