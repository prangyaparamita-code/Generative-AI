import React, { useState } from 'react';
import {
  X,
  Cpu,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Activity,
  Key,
  ExternalLink,
} from 'lucide-react';
import { AppSettings, ProviderStatus } from '../types';
import { testConnection } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  providerStatus: ProviderStatus | null;
  onRefreshStatus: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  providerStatus,
  onRefreshStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'instructions' | 'parameters' | 'provider'>('instructions');
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [testResult, setTestResult] = useState<{
    loading: boolean;
    success?: boolean;
    latencyMs?: number;
    error?: string;
    statusText?: string;
  }>({ loading: false });

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  const handleTestNvidia = async () => {
    setTestResult({ loading: true });
    const res = await testConnection('nvidia', formData.customBaseUrl);
    setTestResult({
      loading: false,
      success: res.success,
      latencyMs: res.latencyMs,
      error: res.error,
      statusText: res.statusText,
    });
    onRefreshStatus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-zinc-100">Settings & Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 px-6 bg-zinc-950/40 text-xs">
          <button
            onClick={() => setActiveTab('instructions')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'instructions'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Custom Instructions
          </button>
          <button
            onClick={() => setActiveTab('parameters')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'parameters'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Model Parameters
          </button>
          <button
            onClick={() => setActiveTab('provider')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'provider'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>NVIDIA NIM & API</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-zinc-300">
          {activeTab === 'instructions' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                  System Persona & Context
                </label>
                <textarea
                  value={formData.systemPrompt}
                  onChange={e => setFormData({ ...formData, systemPrompt: e.target.value })}
                  rows={3}
                  placeholder="Define role, boundaries, and fundamental guidelines for NexusAI..."
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                  What would you like NexusAI to know about you?
                </label>
                <textarea
                  value={formData.userInstructions}
                  onChange={e => setFormData({ ...formData, userInstructions: e.target.value })}
                  rows={3}
                  placeholder="e.g. I am a software engineer building TypeScript apps. Prefer code solutions, minimal fluff, and idiomatic patterns."
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                  Response Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['concise', 'balanced', 'detailed'] as const).map(style => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setFormData({ ...formData, responseStyle: style })}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize transition-all ${
                        formData.responseStyle === style
                          ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-300'
                          : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'parameters' && (
            <div className="space-y-5">
              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-zinc-200">Temperature</span>
                  <span className="font-mono text-emerald-400">{formData.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={formData.temperature}
                  onChange={e => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
                  <span>Precise & Deterministic (0.0)</span>
                  <span>Creative & Exploratory (1.5)</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-zinc-200">Max Output Tokens</span>
                  <span className="font-mono text-emerald-400">{formData.maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="512"
                  max="8192"
                  step="256"
                  value={formData.maxTokens}
                  onChange={e => setFormData({ ...formData, maxTokens: parseInt(e.target.value, 10) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
                  <span>512 tokens</span>
                  <span>8192 tokens</span>
                </div>
              </div>

              {/* Top-P */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-zinc-200">Top-P (Nucleus Sampling)</span>
                  <span className="font-mono text-emerald-400">{formData.topP}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={formData.topP}
                  onChange={e => setFormData({ ...formData, topP: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'provider' && (
            <div className="space-y-4">
              {/* NVIDIA NIM Status Card */}
              <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-sm text-zinc-100">NVIDIA NIM Microservice</span>
                  </div>
                  {providerStatus?.nvidiaAvailable ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      API Key Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Key Not Detected
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  NexusAI connects to NVIDIA’s high-throughput NIM API (Llama 3.3 70B, DeepSeek R1, Nemotron 70B) via standard OpenAI-compatible endpoints.
                </p>

                {/* Base URL setting */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    NVIDIA Base URL
                  </label>
                  <input
                    type="text"
                    value={formData.customBaseUrl || 'https://integrate.api.nvidia.com/v1'}
                    onChange={e => setFormData({ ...formData, customBaseUrl: e.target.value })}
                    placeholder="https://integrate.api.nvidia.com/v1"
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Default is <code className="text-zinc-400">https://integrate.api.nvidia.com/v1</code>. Can be pointed to local container or vLLM.
                  </span>
                </div>

                {/* Test Connection Button */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTestNvidia}
                    disabled={testResult.loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Activity className={`w-3.5 h-3.5 text-emerald-400 ${testResult.loading ? 'animate-spin' : ''}`} />
                    <span>{testResult.loading ? 'Testing...' : 'Test Connection'}</span>
                  </button>

                  {testResult.success !== undefined && (
                    <span className={`text-xs ${testResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {testResult.success
                        ? `✓ Success (${testResult.latencyMs}ms)`
                        : `✗ ${testResult.error || 'Failed'}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Instructions on setting the key */}
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-2 text-xs text-zinc-300">
                <div className="flex items-center gap-1.5 font-medium text-emerald-400">
                  <Key className="w-3.5 h-3.5" />
                  <span>How to configure NVIDIA_API_KEY</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-zinc-400">
                  <li>
                    Visit{' '}
                    <a
                      href="https://build.nvidia.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 underline inline-flex items-center gap-0.5"
                    >
                      build.nvidia.com <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    and generate an API key (starts with <code className="text-zinc-300">nvapi-</code>).
                  </li>
                  <li>
                    In AI Studio, configure <strong className="text-zinc-200">NVIDIA_API_KEY</strong> in the Secrets panel or add it to your <code className="text-zinc-300">.env</code> file.
                  </li>
                  <li>
                    Reload the app or click "Test Connection" above to verify.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
