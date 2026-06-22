import { CardSkeleton, KanbanSkeleton } from "@/components/skeleton";

export default function ClientDashboardLoading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded-md bg-gray-200" />
        <div className="h-9 w-28 animate-pulse rounded-md bg-gray-200" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="mt-8">
        <KanbanSkeleton />
      </div>
    </div>
  );
}
