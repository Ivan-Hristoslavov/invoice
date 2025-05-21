import { Skeleton } from "@/components/ui/skeleton";

export default function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Skeleton className="h-[400px] w-full" />
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    </div>
  );
} 