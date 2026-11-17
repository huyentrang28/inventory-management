import React from "react";

export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => {
  return <div className={`animate-pulse bg-slate-200/80 rounded-lg ${className}`} />;
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number; columns?: number }> = ({
  rows = 5,
  cols = 5,
  columns,
}) => {
  const columnCount = columns || cols;
  return (
    <div className="w-full space-y-3">
      <Skeleton className="h-10 w-full rounded-t-lg" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center py-2">
          {Array.from({ length: columnCount }).map((_, c) => (
            <Skeleton key={c} className="h-6 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonTable = TableSkeleton;
