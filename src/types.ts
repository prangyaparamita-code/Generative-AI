export type ProviderType = 'nvidia' | 'gemini' | 'custom';

export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderType;
  developer: string;
  description: string;
  contextLength: string;
  capabilities: ('reasoning' | 'code' | 'multilingual' | 'fast' | 'general')[];
  recommended?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  textContent?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoningContent?: string;
  timestamp: number;
  model?: string;
  provider?: ProviderType;
  attachments?: Attachment[];
  status?: 'sending' | 'streaming' | 'completed' | 'error';
  latencyMs?: number;
  reaction?: 'up' | 'down';
  errorMessage?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  modelId: string;
  messages: Message[];
}

export interface AppSettings {
  defaultModelId: string;
  systemPrompt: string;
  userInstructions: string;
  responseStyle: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  customBaseUrl?: string;
  streamResponse: boolean;
  showReasoning: boolean;
  theme: 'dark' | 'light';
}

export interface ProviderStatus {
  nvidiaAvailable: boolean;
  nvidiaBaseUrl: string;
  geminiAvailable: boolean;
  activeProvider: ProviderType;
  serverEnvDetected: {
    hasNvidiaKey: boolean;
    hasGeminiKey: boolean;
  };
}
