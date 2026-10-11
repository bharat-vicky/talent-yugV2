import { Skeleton } from "@/components/ui/skeleton";

export default function TemplatesLoading() {
  return (
    <div className="flex flex-col gap-8 h-full pb-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      
      {/* Statistics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-muted/20 p-2 rounded-xl border border-border/50">
        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-2 items-center">
          <Skeleton className="h-9 w-full sm:w-80" />
          <Skeleton className="h-9 w-full sm:w-40" />
          <Skeleton className="h-9 w-full sm:w-40" />
        </div>
        <Skeleton className="h-9 w-20 shrink-0" />
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-80 rounded-lg mb-2" />

      {/* Grid Content */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col rounded-xl border border-border/50 bg-background overflow-hidden">
            <Skeleton className="aspect-video w-full rounded-none" />
            <div className="p-5 flex-1 flex flex-col gap-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="mt-auto pt-4 border-t border-border/50 flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
