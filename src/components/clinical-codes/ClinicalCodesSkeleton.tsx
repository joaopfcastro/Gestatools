import React from 'react';
import Skeleton from '../Skeleton';

export default function ClinicalCodesSkeleton() {
  return (
    <div className="w-full max-w-6xl min-[1366px]:max-w-7xl mx-auto flex flex-col justify-start gap-3 min-[1024px]:gap-5 p-0 sm:p-2 min-[1366px]:p-4 h-auto min-w-0">
      {/* Header Skeleton */}
      <div className="px-1 w-full space-y-1.5">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-md hidden md:block" />
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 min-[1024px]:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)] min-[1366px]:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)] gap-4 min-[1024px]:gap-6 min-[1366px]:gap-8 items-start w-full min-w-0">
        {/* Left Column: Search & List Panel Skeleton */}
        <div className="glass-panel p-3.5 sm:p-5 min-[1024px]:p-6 rounded-[1.25rem] md:rounded-[2rem] border border-surface-variant space-y-4 w-full">
          <Skeleton className="h-11 w-full rounded-2xl" />
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>

        {/* Right Column: Details Panel Skeleton (Desktop only) */}
        <div className="hidden min-[1024px]:block w-full">
          <div className="glass-panel p-6 rounded-[1.25rem] md:rounded-[2rem] border border-surface-variant space-y-4">
            <Skeleton className="h-8 w-32 rounded-lg" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
