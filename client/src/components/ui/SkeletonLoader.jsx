import React from 'react';

export function SkeletonLoader({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full animate-pulse space-y-3 py-2">
      <div className="h-9 bg-gray-200 dark:bg-navy-600 rounded w-full mb-4" />
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div key={cIdx} className="h-7 bg-gray-100 dark:bg-navy-800 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default SkeletonLoader;
