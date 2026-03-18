interface EmptyStateProps {
  title: string;
  description: string;
}

function EmptyState({ title, description }: EmptyStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <svg
        className="h-20 w-20 text-gray-600 mb-6"
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Magnifying glass */}
        <circle cx="28" cy="28" r="16" />
        <line x1="40" y1="40" x2="56" y2="56" strokeWidth="4" />
        {/* Bar chart inside */}
        <rect x="20" y="28" width="4" height="8" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="26" y="22" width="4" height="14" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="32" y="25" width="4" height="11" rx="1" fill="currentColor" opacity="0.4" />
      </svg>
      <h2 className="text-xl font-semibold text-gray-300 mb-2">{title}</h2>
      <p className="text-gray-500 max-w-sm">{description}</p>
    </div>
  );
}

export default EmptyState;
