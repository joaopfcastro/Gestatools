import React from 'react';
import Skeleton from '../Skeleton';

export default function ClinicalCodesSkeleton() {
  return (
    <div className="w-full space-y-4">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md hidden md:block" />
        </div>
        <Skeleton className="h-4 w-32 rounded-md" />
      </div>

      {/* Search Bar Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-56 rounded-xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 min-[1024px]:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)] gap-4 min-[1024px]:gap-6">
        <div className="space-y-2.5">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
        <div className="hidden min-[1024px]:block">
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
