import { CardSkeleton, TableSkeleton } from "@/components/skeleton";

export default function AdminLoading() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-32 animate-pulse rounded-lg bg-gray-200/70" />
          <div className="mt-1.5 h-4 w-48 animate-pulse rounded-lg bg-gray-200/70" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-200/70" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TableSkeleton rows={5} cols={3} />
        <TableSkeleton rows={4} cols={4} />
      </div>
    </div>
  );
}
