import { Suspense } from "react";
import EditInvoiceForm from "./EditInvoiceForm";
import { Skeleton } from "@/components/ui/skeleton";

export default async function EditInvoicePage(props: { params: { id: string } }) {
  const { params } = props;
  const id = params.id;
  
  return (
    <Suspense fallback={<EditInvoiceSkeleton />}>
      <EditInvoiceForm invoiceId={id} />
    </Suspense>
  );
}

function EditInvoiceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    </div>
  );
} 