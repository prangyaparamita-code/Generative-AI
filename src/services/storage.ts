import { Conversation, AppSettings, Message } from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'nexusai_conversations_v1',
  ACTIVE_ID: 'nexusai_active_id_v1',
  SETTINGS: 'nexusai_settings_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  defaultModelId: 'meta/llama-3.3-70b-instruct',
  systemPrompt: 'You are NexusAI, an advanced and intelligent AI assistant powered by state-of-the-art open models and NVIDIA NIM. You provide thorough, concise, accurate, and deeply insightful answers. When writing code, provide clean, idiomatic, and modern implementations with brief explanations.',
  userInstructions: '',
  responseStyle: 'balanced',
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 4096,
  streamResponse: true,
  showReasoning: true,
  theme: 'dark',
};

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load settings from storage', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to storage', e);
  }
}

export function createNewConversation(modelId: string, initialTitle = 'New Chat'): Conversation {
  return {
    id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title: initialTitle,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    modelId,
    messages: [],
    pinned: false,
  };
}

export function getStoredConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load conversations from storage', e);
    return [];
  }
}

export function saveStoredConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to save conversations to storage', e);
  }
}

export function getStoredActiveConversationId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
  } catch {
    return null;
  }
}

export function saveStoredActiveConversationId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
    }
  } catch (e) {
    console.error('Failed to save active conversation id', e);
  }
}
