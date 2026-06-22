import { TableSkeleton } from "@/components/skeleton";

export default function ClientsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded-md bg-gray-200" />
        <div className="h-9 w-28 animate-pulse rounded-md bg-gray-200" />
      </div>
      <div className="mt-6">
        <TableSkeleton rows={5} cols={4} />
      </div>
    </div>
  );
}
