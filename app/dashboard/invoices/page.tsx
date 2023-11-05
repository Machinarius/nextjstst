import Pagination from "@ui/invoices/pagination";
import Search from "@ui/search";
import Table from "@ui/invoices/table";
import { CreateInvoice } from "@ui/invoices/buttons";
import { lusitana } from "@ui/fonts";
import { InvoicesTableSkeleton } from "@ui/skeletons";
import { Suspense } from "react";
import { fetchInvoicesPages } from "@/app/lib/data";

// This is a default auto-magic _static_ server route component.
// Parameters are fed into this component by NextJS from the path
// automatically because the parameter is named `searchParams`.
// This is in contrast to dynamic client components that should
// use the `useSearchParams` hook instead.
export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  const totalPageCount = await fetchInvoicesPages(query);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Invoices</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search />
        <CreateInvoice />
      </div>
      <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <Table query={query} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPageCount} />
      </div>
    </div>
  );
}
