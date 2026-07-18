export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-border-light rounded-xl overflow-hidden">
      <div className="w-full aspect-[16/9] bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <SkeletonLine className="h-4 w-3/4" />
        <SkeletonLine className="h-3 w-1/2" />
        <SkeletonLine className="h-3 w-1/3" />
        <div className="flex gap-2 pt-1">
          <SkeletonLine className="h-5 w-16" />
          <SkeletonLine className="h-5 w-12" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
  );
}

export function SkeletonDetailPage() {
  return (
    <div className="space-y-6">
      <SkeletonLine className="h-8 w-2/3" />
      <SkeletonLine className="h-4 w-full" />
      <SkeletonLine className="h-4 w-5/6" />
      <div className="flex gap-4 mt-4">
        <SkeletonLine className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <SkeletonLine className="h-4 w-32" />
          <SkeletonLine className="h-3 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonLine key={i} className="h-20" />
        ))}
      </div>
      <SkeletonBlock className="h-64 w-full mt-4" />
    </div>
  );
}
