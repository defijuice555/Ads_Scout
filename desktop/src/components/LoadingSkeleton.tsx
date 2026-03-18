interface LoadingSkeletonProps {
  keyword: string;
}

function LoadingSkeleton({ keyword }: LoadingSkeletonProps): JSX.Element {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <svg
          className="h-5 w-5 animate-spin text-blue-400"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-gray-300 text-lg font-medium">
          Analyzing <span className="text-blue-400">{keyword}</span>
          <span className="animate-pulse">...</span>
        </p>
      </div>

      {/* Top row: gauge + dimension bars */}
      <div className="flex gap-6 items-start">
        <div className="w-[300px] flex-shrink-0 bg-gray-800 rounded-xl p-4 animate-pulse">
          <div className="h-4 w-32 bg-gray-700 rounded mb-4" />
          <div className="h-40 w-40 mx-auto bg-gray-700 rounded-full" />
          <div className="h-6 w-20 bg-gray-700 rounded mx-auto mt-4" />
        </div>
        <div className="flex-1 bg-gray-800 rounded-xl p-4 animate-pulse">
          <div className="h-5 w-40 bg-gray-700 rounded mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <div className="h-3 w-28 bg-gray-700 rounded" />
                  <div className="h-3 w-10 bg-gray-700 rounded" />
                </div>
                <div className="h-2 bg-gray-700 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drivers chart area */}
      <div className="bg-gray-800 rounded-xl p-4 animate-pulse">
        <div className="h-5 w-32 bg-gray-700 rounded mb-4" />
        <div className="flex gap-3 items-end h-40">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-gray-700 rounded-t"
              style={{ height: `${40 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </div>

      {/* Table area */}
      <div className="bg-gray-800 rounded-xl p-4 animate-pulse">
        <div className="h-5 w-36 bg-gray-700 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 flex-[2] bg-gray-700 rounded" />
              <div className="h-4 flex-1 bg-gray-700 rounded" />
              <div className="h-4 flex-1 bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-4 animate-pulse">
          <div className="h-5 w-36 bg-gray-700 rounded mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-700 rounded" style={{ width: `${60 + i * 15}%` }} />
            ))}
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 animate-pulse">
          <div className="h-5 w-40 bg-gray-700 rounded mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-700 rounded" style={{ width: `${70 + i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingSkeleton;
