export function EmptyState({ 
  icon = 'inbox',
  title,
  description,
  action
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className="text-center py-16">
      <span className="material-symbols-outlined text-on-surface-variant text-6xl mb-4 block opacity-50">
        {icon}
      </span>
      <h3 className="text-xl font-bold text-on-surface mb-2">{title}</h3>
      {description && (
        <p className="text-on-surface-variant text-sm mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="bg-primary hover:bg-primary-dim text-[#0e0e10] px-6 py-3 rounded-lg font-bold transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
