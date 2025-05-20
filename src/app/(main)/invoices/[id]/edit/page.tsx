import { Suspense } from "react";
import EditInvoiceForm from "./EditInvoiceForm";
import { Skeleton } from "@/components/ui/skeleton";

interface EditInvoicePageProps {
  params: {
    id: string;
  };
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { id } = await Promise.resolve(params);
  
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