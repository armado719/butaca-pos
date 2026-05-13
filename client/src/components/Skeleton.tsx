import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'text' }) => {
  const baseClasses = "animate-pulse bg-gray-200";
  
  const variantClasses = {
    text: "h-4 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};

export const TableSkeleton: React.FC<{ rows?: number, cols?: number }> = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 h-10 border-b border-gray-100 flex items-center px-4 gap-4">
        {[...Array(cols)].map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-gray-50">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 flex items-center gap-4">
            {[...Array(cols)].map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const GridSkeleton: React.FC<{ cards?: number }> = ({ cards = 8 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {[...Array(cards)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
          <div className="flex justify-between items-start">
            <Skeleton className="w-16 h-4" />
            <Skeleton variant="circular" className="w-2 h-2" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-6 w-1/2 mt-2" />
          <Skeleton className="h-8 w-full mt-3" />
        </div>
      ))}
    </div>
  );
};
