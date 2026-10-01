import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  Share2,
  Trash2,
  Cpu,
  BrainCircuit,
  Zap,
  Check,
} from 'lucide-react';
import { ModelInfo, ProviderStatus } from '../types';

interface HeaderProps {
  currentModelId: string;
  models: ModelInfo[];
  providerStatus: ProviderStatus | null;
  onSelectModel: (modelId: string) => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onClearConversation: () => void;
  hasMessages: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentModelId,
  models,
  providerStatus,
  onSelectModel,
  onToggleSidebar,
  onOpenSettings,
  onOpenExport,
  onClearConversation,
  hasMessages,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel = models.find(m => m.id === currentModelId) || models[0] || {
    id: currentModelId,
    name: currentModelId,
    provider: 'nvidia',
    developer: 'NVIDIA NIM',
    description: '',
    contextLength: '128k',
    capabilities: ['general'],
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nvidiaModels = models.filter(m => m.provider === 'nvidia');
  const geminiModels = models.filter(m => m.provider === 'gemini');

  return (
    <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
      {/* Left: Mobile sidebar toggle + Model Selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition-colors md:hidden"
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Model Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-zinc-800/70 border border-transparent hover:border-zinc-700/60 transition-all text-left group"
            aria-expanded={dropdownOpen}
          >
            <div className={`w-2 h-2 rounded-full ${
              selectedModel.provider === 'nvidia'
                ? (providerStatus?.nvidiaAvailable ? 'bg-emerald-400 ring-2 ring-emerald-500/20' : 'bg-emerald-400')
                : (providerStatus?.geminiAvailable ? 'bg-blue-400 ring-2 ring-blue-500/20' : 'bg-blue-400')
            }`} />

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-zinc-100 group-hover:text-white tracking-tight">
                  {selectedModel.name}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              <span className="text-[11px] text-zinc-400 leading-none">
                {selectedModel.provider === 'nvidia' ? 'NVIDIA NIM' : 'Google AI'} · {selectedModel.contextLength}
              </span>
            </div>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-80 sm:w-96 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
              {/* Header inside dropdown */}
              <div className="px-3 py-2 border-b border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">Select Intelligence Model</span>
                <span className="text-[11px] text-zinc-500">
                  {selectedModel.provider === 'nvidia' ? 'NVIDIA NIM Enabled' : 'Gemini Enabled'}
                </span>
              </div>

              <div className="max-h-[380px] overflow-y-auto py-1 space-y-3">
                {/* NVIDIA NIM Section */}
                <div>
                  <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>NVIDIA NIM Models</span>
                    {providerStatus?.nvidiaAvailable && (
                      <span className="ml-auto text-[10px] text-emerald-400 font-normal normal-case bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        API Connected
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {nvidiaModels.map(model => (
                      <button
                        key={model.id}
                        onClick={() => {
                          onSelectModel(model.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-start justify-between group ${
                          model.id === currentModelId
                            ? 'bg-emerald-500/15 border border-emerald-500/30'
                            : 'hover:bg-zinc-800/70 border border-transparent'
                        }`}
                      >
                        <div className="space-y-0.5 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-zinc-100 group-hover:text-white">
                              {model.name}
                            </span>
                            {model.capabilities.includes('reasoning') && (
                              <span className="flex items-center gap-1 text-[10px] text-purple-300 bg-purple-500/15 px-1.5 py-0.2 rounded font-mono">
                                <BrainCircuit className="w-2.5 h-2.5" /> Reasoning
                              </span>
                            )}
                            {model.capabilities.includes('fast') && (
                              <span className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/15 px-1.5 py-0.2 rounded font-mono">
                                <Zap className="w-2.5 h-2.5" /> Fast
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-zinc-400 line-clamp-1 leading-snug">
                            {model.description}
                          </p>
                        </div>
                        {model.id === currentModelId && (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gemini Section */}
                <div>
                  <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5 border-t border-zinc-800/60">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Google Gemini Models</span>
                  </div>
                  <div className="space-y-0.5">
                    {geminiModels.map(model => (
                      <button
                        key={model.id}
                        onClick={() => {
                          onSelectModel(model.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-start justify-between group ${
                          model.id === currentModelId
                            ? 'bg-blue-500/15 border border-blue-500/30'
                            : 'hover:bg-zinc-800/70 border border-transparent'
                        }`}
                      >
                        <div className="space-y-0.5 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-zinc-100 group-hover:text-white">
                              {model.name}
                            </span>
                            <span className="text-[10px] text-blue-300 bg-blue-500/15 px-1.5 py-0.2 rounded font-mono">
                              {model.contextLength}
                            </span>
                          </div>
                          <p className="text-[12px] text-zinc-400 line-clamp-1 leading-snug">
                            {model.description}
                          </p>
                        </div>
                        {model.id === currentModelId && (
                          <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom hint */}
              <div className="px-3 py-2 bg-zinc-950/60 rounded-b-lg border-t border-zinc-800/80 text-[11px] text-zinc-500 flex items-center justify-between">
                <span>Runs via NVIDIA API Key or Gemini API</span>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenSettings();
                  }}
                  className="text-zinc-400 hover:text-zinc-200 underline"
                >
                  Configure
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {hasMessages && (
          <>
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/70 rounded-lg transition-colors"
              title="Share or Export Conversation"
            >
              <Share2 className="w-4 h-4 text-zinc-400" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={onClearConversation}
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Clear Messages"
              aria-label="Clear Messages"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/70 rounded-lg transition-colors"
          title="Settings & Model Parameters"
        >
          <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
          <span className="hidden sm:inline">Parameters</span>
        </button>
      </div>
    </header>
  );
};
