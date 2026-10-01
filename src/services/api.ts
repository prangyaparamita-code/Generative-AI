import { ModelInfo, ProviderStatus, Message, AppSettings } from '../types';

export interface StreamChatParams {
  messages: Message[];
  modelId: string;
  settings: AppSettings;
  signal?: AbortSignal;
  onChunk: (contentChunk: string, reasoningChunk?: string) => void;
  onDone: (latencyMs: number) => void;
  onError: (errorText: string) => void;
}

export async function fetchServerStatus(): Promise<ProviderStatus> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Status request failed');
    return await res.json();
  } catch (err: any) {
    return {
      nvidiaAvailable: false,
      nvidiaBaseUrl: 'https://integrate.api.nvidia.com/v1',
      geminiAvailable: false,
      activeProvider: 'nvidia',
      serverEnvDetected: {
        hasNvidiaKey: false,
        hasGeminiKey: false,
      },
    };
  }
}

export async function fetchModels(): Promise<ModelInfo[]> {
  try {
    const res = await fetch('/api/models');
    if (!res.ok) throw new Error('Models request failed');
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function testConnection(provider: 'nvidia' | 'gemini', baseUrl?: string): Promise<{ success: boolean; latencyMs: number; error?: string; statusText?: string }> {
  try {
    const res = await fetch('/api/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider, baseUrl }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      latencyMs: 0,
      error: err.message || 'Connection test failed',
    };
  }
}

export async function streamChatCompletion({
  messages,
  modelId,
  settings,
  signal,
  onChunk,
  onDone,
  onError,
}: StreamChatParams): Promise<void> {
  try {
    // Construct effective system prompt incorporating user instructions
    let effectiveSystemPrompt = settings.systemPrompt || '';
    if (settings.userInstructions && settings.userInstructions.trim()) {
      effectiveSystemPrompt += `\n\nUser Profile & Preferences:\n${settings.userInstructions.trim()}`;
    }
    if (settings.responseStyle === 'concise') {
      effectiveSystemPrompt += '\n\nPlease be extremely concise and direct in your response.';
    } else if (settings.responseStyle === 'detailed') {
      effectiveSystemPrompt += '\n\nPlease provide an exhaustive, deeply detailed and comprehensive breakdown.';
    }

    const payload = {
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      })),
      model: modelId,
      systemPrompt: effectiveSystemPrompt,
      temperature: settings.temperature,
      topP: settings.topP,
      maxTokens: settings.maxTokens,
      customBaseUrl: settings.customBaseUrl,
    };

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      onError(`Request error: ${res.status} - ${errText}`);
      return;
    }

    if (!res.body) {
      onError('No response body received from server.');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.slice(5).trim();
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.type === 'chunk') {
            onChunk(parsed.content || '', parsed.reasoning || '');
          } else if (parsed.type === 'done') {
            onDone(parsed.latencyMs || 0);
          } else if (parsed.type === 'error') {
            onError(parsed.error || 'Unknown error received from model stream');
          }
        } catch {
          // Ignore partial JSON parses
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      // User aborted stream
      onDone(0);
      return;
    }
    onError(err.message || 'Stream connection failed');
  }
}
