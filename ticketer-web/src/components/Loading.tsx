export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin`} />
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-on-surface-variant">Loading...</p>
      </div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="bg-surface-container-low rounded-lg p-8 animate-pulse">
      <div className="h-4 bg-surface-container-high rounded w-3/4 mb-4" />
      <div className="h-4 bg-surface-container-high rounded w-1/2 mb-4" />
      <div className="h-4 bg-surface-container-high rounded w-2/3" />
    </div>
  );
}
