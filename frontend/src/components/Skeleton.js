import React from 'react';

/**
 * Reusable skeleton loading card matching ProductCard dimensions
 */
export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="shimmer h-72 w-full" />
      <div className="p-4 space-y-3">
        <div className="shimmer h-4 rounded w-3/4" />
        <div className="shimmer h-3 rounded w-1/2" />
        <div className="flex justify-between">
          <div className="shimmer h-5 rounded w-1/3" />
          <div className="shimmer h-8 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function TextSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="shimmer h-4 rounded"
          style={{ width: `${80 + (i % 3) * 10}%` }}
        />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card p-6 animate-pulse flex items-center gap-4">
      <div className="shimmer w-14 h-14 rounded-xl" />
      <div className="space-y-2 flex-1">
        <div className="shimmer h-3 rounded w-1/2" />
        <div className="shimmer h-6 rounded w-1/3" />
      </div>
    </div>
  );
}

export default ProductCardSkeleton;
