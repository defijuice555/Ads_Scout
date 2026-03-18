import { useState } from 'react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

function ErrorBanner({ message, onRetry }: ErrorBannerProps): JSX.Element | null {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isPythonMissing = message.toLowerCase().includes('python not found');
  const isPartialResults = message.toLowerCase().includes('some sources');

  return (
    <div
      className={`relative rounded-xl border p-4 ${
        isPartialResults
          ? 'bg-yellow-900/50 border-yellow-700 text-yellow-200'
          : 'bg-red-900/50 border-red-700 text-red-200'
      }`}
    >
      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div className="pr-8">
        <p className="font-medium">{isPartialResults ? 'Partial Results' : 'Error'}</p>
        <p className="text-sm mt-1 opacity-90">{message}</p>

        {isPythonMissing && (
          <div className="mt-3 text-sm bg-black/30 rounded-lg p-3 font-mono">
            <p className="text-gray-300 mb-1">Install Python 3.10+:</p>
            <p className="text-gray-400">macOS: brew install python</p>
            <p className="text-gray-400">Windows: winget install Python.Python.3.12</p>
            <p className="text-gray-400">Linux: sudo apt install python3</p>
          </div>
        )}

        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 rounded-lg bg-white/10 px-4 py-1.5 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorBanner;
