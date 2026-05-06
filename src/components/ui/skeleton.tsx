import * as React from "react";
import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  circular?: boolean;
};

function Skeleton({ className, circular = false, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-gray-200",
        circular ? "rounded-full" : "rounded-md",
        className
      )}
      {...props}
    />
  );
}

type SkeletonTextProps = {
  lines?: number;
  className?: string;
  lineClassName?: string;
};

function SkeletonText({ lines = 3, className, lineClassName }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            "h-4 w-full",
            index === lines - 1 && lines > 1 ? "w-5/6" : "",
            lineClassName
          )}
        />
      ))}
    </div>
  );
}

type SkeletonAvatarProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: number | string;
};

function SkeletonAvatar({ className, size = 48, style, ...props }: SkeletonAvatarProps) {
  return (
    <Skeleton
      circular
      className={className}
      style={{ width: size, height: size, ...style }}
      {...props}
    />
  );
}

type SkeletonCardProps = {
  className?: string;
  titleWidth?: string;
  lines?: number;
  showAvatar?: boolean;
};

function SkeletonCard({ className, titleWidth = "40%", lines = 3, showAvatar = false }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-lg border border-gray-200 bg-white p-6 shadow-sm", className)}>
      <div className="flex items-start gap-4">
        {showAvatar ? <SkeletonAvatar size={56} className="shrink-0" /> : null}
        <div className="flex-1 space-y-4">
          <Skeleton className="h-6" style={{ width: titleWidth }} />
          <SkeletonText lines={lines} lineClassName="h-4" />
        </div>
      </div>
    </div>
  );
}

type SkeletonTableProps = {
  columns?: number;
  rows?: number;
  className?: string;
  showHeader?: boolean;
};

function SkeletonTable({ columns = 4, rows = 5, className, showHeader = true }: SkeletonTableProps) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-gray-200 bg-white", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {showHeader ? (
            <thead className="bg-gray-50">
              <tr>
                {Array.from({ length: columns }).map((_, index) => (
                  <th key={index} className="px-4 py-3 text-left">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-t border-gray-100">
                {Array.from({ length: columns }).map((__, columnIndex) => (
                  <td key={columnIndex} className="px-4 py-4">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonTable };