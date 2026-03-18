import { useState, useEffect } from 'react';

type Provider = 'anthropic' | 'openai' | 'minimax';

const PROVIDERS: { value: Provider; label: string; placeholder: string }[] = [
  { value: 'anthropic', label: 'Claude (Anthropic)', placeholder: 'sk-ant-...' },
  { value: 'openai', label: 'GPT-4o (OpenAI)', placeholder: 'sk-...' },
  { value: 'minimax', label: 'MiniMax M2', placeholder: 'eyJ...' },
];

function ApiKeySettings(): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const [provider, setProvider] = useState<Provider>('anthropic');
  const [keys, setKeys] = useState<Record<Provider, string>>({ anthropic: '', openai: '', minimax: '' });
  const [savedStatus, setSavedStatus] = useState<Record<Provider, boolean>>({ anthropic: false, openai: false, minimax: false });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.electronAPI.getAiConfig().then((config) => {
      setProvider(config.provider as Provider);
      setSavedStatus({
        anthropic: config.anthropicKey,
        openai: config.openaiKey,
        minimax: config.minimaxKey,
      });
    });
  }, []);

  const currentProvider = PROVIDERS.find((p) => p.value === provider) ?? PROVIDERS[0];

  async function handleSaveKey(): Promise<void> {
    const key = keys[provider]?.trim();
    if (!key) return;

    const keyField = `${provider}_api_key`;
    await window.electronAPI.saveAiConfig({ [keyField]: key, provider });
    setSavedStatus((prev) => ({ ...prev, [provider]: true }));
    setKeys((prev) => ({ ...prev, [provider]: '' }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleProviderChange(p: Provider): Promise<void> {
    setProvider(p);
    await window.electronAPI.saveAiConfig({ provider: p });
  }

  return (
    <div className="mt-4 border-t border-gray-800 pt-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors w-full"
      >
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
            clipRule="evenodd"
          />
        </svg>
        AI Settings
        {savedStatus[provider] && (
          <span className="ml-auto text-green-500 text-xs">{currentProvider.label} ready</span>
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Provider selector */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">LLM Provider</label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as Provider)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label} {savedStatus[p.value] ? '(key set)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* API key input for selected provider */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">{currentProvider.label} API Key</label>
            {savedStatus[provider] ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-500 font-mono">Key saved</span>
                <button
                  type="button"
                  onClick={() => setSavedStatus((prev) => ({ ...prev, [provider]: false }))}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  type="password"
                  value={keys[provider]}
                  onChange={(e) => setKeys((prev) => ({ ...prev, [provider]: e.target.value }))}
                  placeholder={currentProvider.placeholder}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveKey}
                  disabled={!keys[provider]?.trim()}
                  className="w-full mt-2 rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  {saved ? 'Saved!' : 'Save Key'}
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            Required for AI-powered ad strategies. Keys stored locally only.
          </p>
        </div>
      )}
    </div>
  );
}

export default ApiKeySettings;
