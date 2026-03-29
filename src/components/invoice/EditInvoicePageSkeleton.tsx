import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton за страницата за редакция на фактура (route loading + Suspense). */
export function EditInvoicePageSkeleton() {
  return (
    <div className="app-page-shell min-w-0 space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="h-9 w-[5.5rem] shrink-0 rounded-full" />
          <Skeleton className="h-7 w-48 max-w-[60vw] sm:w-64" />
        </div>
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-9 rounded-md md:hidden" />
          <div className="hidden gap-2 md:flex">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
          <Skeleton className="hidden h-9 w-28 rounded-lg sm:inline-flex md:hidden" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <div className="rounded-2xl border border-border/50 bg-card/40 p-4 shadow-sm">
            <Skeleton className="mb-4 h-5 w-40" />
            <Skeleton className="mb-3 h-4 w-full max-w-md" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-[280px] w-full rounded-2xl" />
          <Skeleton className="h-[200px] w-full rounded-2xl" />
        </div>
        <Skeleton className="h-[220px] w-full rounded-2xl md:h-auto md:min-h-[280px]" />
      </div>
    </div>
  );
}
