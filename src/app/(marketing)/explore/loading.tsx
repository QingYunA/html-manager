import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ExploreLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-8 w-64 sm:w-80" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>

      {/* 4 Category Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg border border-border bg-card/60 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-6 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>

      {/* Gallery Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden border-border bg-card/80">
            {/* Aspect video thumbnail skeleton */}
            <div className="aspect-video w-full bg-neutral-950/60 relative overflow-hidden flex items-center justify-center">
              <Skeleton className="w-full h-full opacity-40" />
              <Skeleton className="absolute top-2 left-2 h-4 w-16 rounded-md" />
            </div>
            <CardHeader className="p-4 pb-2 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-full" />
            </CardHeader>
            <CardContent className="p-4 pt-0 pb-3 flex gap-1.5">
              <Skeleton className="h-4 w-12 rounded-sm" />
              <Skeleton className="h-4 w-14 rounded-sm" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
