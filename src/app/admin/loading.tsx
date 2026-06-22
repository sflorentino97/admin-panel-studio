import { CardSkeleton, TableSkeleton } from "@/components/skeleton";

export default function AdminLoading() {
  return (
    <div>
      <div className="h-8 w-40 animate-pulse rounded-md bg-gray-200" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="mt-8">
        <TableSkeleton rows={3} cols={4} />
      </div>
    </div>
  );
}
