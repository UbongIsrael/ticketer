interface ErrorMessageProps {
  error: Error | null;
  title?: string;
  retry?: () => void;
}

export function ErrorMessage({ error, title = 'Something went wrong', retry }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div className="bg-error/10 border border-error/20 rounded-lg p-6 text-center">
      <span className="material-symbols-outlined text-error text-4xl mb-4 block">error</span>
      <h3 className="text-xl font-bold text-error mb-2">{title}</h3>
      <p className="text-on-surface-variant text-sm mb-4">{error.message}</p>
      {retry && (
        <button
          onClick={retry}
          className="bg-error/20 hover:bg-error/30 text-error px-6 py-2 rounded-lg font-bold text-sm transition-all"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function ErrorPage({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <ErrorMessage error={error} retry={retry} />
      </div>
    </div>
  );
}
