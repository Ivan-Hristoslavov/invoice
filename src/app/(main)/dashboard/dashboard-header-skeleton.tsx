export function DashboardHeaderSkeleton() {
  return (
    <div className="page-header">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-5 w-28 rounded-md bg-muted animate-pulse" />
        <div className="h-9 w-40 max-w-full rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-full max-w-md rounded-md bg-muted/80 animate-pulse" />
      </div>
      <div className="h-10 w-36 shrink-0 rounded-2xl bg-muted animate-pulse" />
    </div>
  );
}
