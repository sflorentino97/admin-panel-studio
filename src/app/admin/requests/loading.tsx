import { KanbanSkeleton } from "@/components/skeleton";

export default function RequestsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded-md bg-gray-200" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 animate-pulse rounded-md bg-gray-200" />
          <div className="h-9 w-32 animate-pulse rounded-md bg-gray-200" />
        </div>
      </div>
      <div className="mt-6">
        <KanbanSkeleton />
      </div>
    </div>
  );
}
