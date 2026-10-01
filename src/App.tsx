import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import {
  Conversation,
  Message,
  ModelInfo,
  ProviderStatus,
  AppSettings,
  Attachment,
} from './types';
import {
  getStoredConversations,
  saveStoredConversations,
  getStoredActiveConversationId,
  saveStoredActiveConversationId,
  getStoredSettings,
  saveStoredSettings,
  createNewConversation,
  DEFAULT_SETTINGS,
} from './services/storage';
import {
  fetchModels,
  fetchServerStatus,
  streamChatCompletion,
} from './services/api';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => getStoredConversations());
  const [activeId, setActiveId] = useState<string | null>(() => getStoredActiveConversationId());
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>(settings.defaultModelId);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load initial server models & status
  const refreshStatus = async () => {
    try {
      const [fetchedModels, status] = await Promise.all([
        fetchModels(),
        fetchServerStatus(),
      ]);

      if (fetchedModels && fetchedModels.length > 0) {
        setModels(fetchedModels);
        // Ensure selected model exists in list
        if (!fetchedModels.some(m => m.id === selectedModelId)) {
          setSelectedModelId(fetchedModels[0].id);
        }
      }
      setProviderStatus(status);
    } catch (e) {
      console.error('Failed to load server data', e);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    saveStoredConversations(conversations);
  }, [conversations]);

  // Save activeId whenever it changes
  useEffect(() => {
    saveStoredActiveConversationId(activeId);
  }, [activeId]);

  // Current active conversation
  const currentConversation = conversations.find(c => c.id === activeId) || null;

  // Current model object
  const currentModel = models.find(m => m.id === selectedModelId) || {
    id: selectedModelId,
    name: selectedModelId,
    provider: 'nvidia',
    developer: 'NVIDIA NIM',
    description: '',
    contextLength: '128k',
    capabilities: ['general'],
  };

  // Keyboard shortcut listener (Cmd+K for new chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewConversation();
      }
      if (e.key === 'Escape') {
        setSettingsOpen(false);
        setExportOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedModelId]);

  const handleNewConversation = () => {
    const newConv = createNewConversation(selectedModelId);
    setConversations(prev => [newConv, ...prev]);
    setActiveId(newConv.id);
  };

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    const conv = conversations.find(c => c.id === id);
    if (conv?.modelId && models.some(m => m.id === conv.modelId)) {
      setSelectedModelId(conv.modelId);
    }
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setActiveId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  const handleTogglePinConversation = (id: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  const handleClearConversation = () => {
    if (!activeId) return;
    setConversations(prev =>
      prev.map(c => (c.id === activeId ? { ...c, messages: [], updatedAt: Date.now() } : c))
    );
  };

  // Main chat sending handler
  const handleSendMessage = async (content: string, attachments: Attachment[] = []) => {
    if (isGenerating) return;

    let targetConvId = activeId;
    let targetConv = currentConversation;

    // If no active conversation, create one
    if (!targetConvId || !targetConv) {
      const initialTitle = content.slice(0, 36).trim() || 'New Chat';
      const newConv = createNewConversation(selectedModelId, initialTitle);
      setConversations(prev => [newConv, ...prev]);
      setActiveId(newConv.id);
      targetConvId = newConv.id;
      targetConv = newConv;
    } else if (targetConv.messages.length === 0) {
      // Auto-name conversation based on first prompt
      const generatedTitle = content.slice(0, 36).trim() || 'Chat';
      handleRenameConversation(targetConvId, generatedTitle);
    }

    const userMessage: Message = {
      id: 'msg_user_' + Date.now(),
      role: 'user',
      content,
      attachments,
      timestamp: Date.now(),
    };

    const assistantPlaceholderId = 'msg_asst_' + (Date.now() + 1);
    const assistantMessage: Message = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      reasoningContent: '',
      timestamp: Date.now(),
      model: currentModel.name,
      provider: currentModel.provider,
      status: 'streaming',
    };

    // Update conversation with user message and placeholder assistant message
    const updatedMessages = [...(targetConv.messages || []), userMessage, assistantMessage];

    setConversations(prev =>
      prev.map(c =>
        c.id === targetConvId
          ? {
              ...c,
              messages: updatedMessages,
              updatedAt: Date.now(),
              modelId: selectedModelId,
            }
          : c
      )
    );

    setIsGenerating(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedContent = '';
    let accumulatedReasoning = '';

    await streamChatCompletion({
      messages: updatedMessages.slice(0, -1), // send all messages up to user's
      modelId: selectedModelId,
      settings,
      signal: abortController.signal,
      onChunk: (contentChunk, reasoningChunk) => {
        accumulatedContent += contentChunk || '';
        accumulatedReasoning += reasoningChunk || '';

        setConversations(prev =>
          prev.map(c => {
            if (c.id !== targetConvId) return c;
            const msgs = [...c.messages];
            const lastIdx = msgs.findIndex(m => m.id === assistantPlaceholderId);
            if (lastIdx !== -1) {
              msgs[lastIdx] = {
                ...msgs[lastIdx],
                content: accumulatedContent,
                reasoningContent: accumulatedReasoning,
                status: 'streaming',
              };
            }
            return { ...c, messages: msgs, updatedAt: Date.now() };
          })
        );
      },
      onDone: (latencyMs) => {
        setIsGenerating(false);
        abortControllerRef.current = null;

        setConversations(prev =>
          prev.map(c => {
            if (c.id !== targetConvId) return c;
            const msgs = [...c.messages];
            const lastIdx = msgs.findIndex(m => m.id === assistantPlaceholderId);
            if (lastIdx !== -1) {
              msgs[lastIdx] = {
                ...msgs[lastIdx],
                content: accumulatedContent,
                reasoningContent: accumulatedReasoning,
                status: 'completed',
                latencyMs,
              };
            }
            return { ...c, messages: msgs, updatedAt: Date.now() };
          })
        );
      },
      onError: (errorText) => {
        setIsGenerating(false);
        abortControllerRef.current = null;

        setConversations(prev =>
          prev.map(c => {
            if (c.id !== targetConvId) return c;
            const msgs = [...c.messages];
            const lastIdx = msgs.findIndex(m => m.id === assistantPlaceholderId);
            if (lastIdx !== -1) {
              msgs[lastIdx] = {
                ...msgs[lastIdx],
                status: 'error',
                errorMessage: errorText,
              };
            }
            return { ...c, messages: msgs, updatedAt: Date.now() };
          })
        );
      },
    });
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  const handleRegenerate = () => {
    if (!currentConversation || currentConversation.messages.length < 2) return;
    const msgs = [...currentConversation.messages];
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg.role !== 'assistant') return;

    // Find the prompt message before it
    const promptMsg = msgs[msgs.length - 2];
    if (promptMsg.role !== 'user') return;

    // Pop the assistant response
    const trimmedMsgs = msgs.slice(0, -1);
    setConversations(prev =>
      prev.map(c =>
        c.id === currentConversation.id ? { ...c, messages: trimmedMsgs } : c
      )
    );

    // Re-trigger sending
    handleSendMessage(promptMsg.content, promptMsg.attachments);
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!currentConversation) return;
    const msgIdx = currentConversation.messages.findIndex(m => m.id === messageId);
    if (msgIdx === -1) return;

    // Slice up to edited message and resend
    const truncated = currentConversation.messages.slice(0, msgIdx);
    setConversations(prev =>
      prev.map(c =>
        c.id === currentConversation.id ? { ...c, messages: truncated } : c
      )
    );

    handleSendMessage(newContent);
  };

  const handleReactMessage = (messageId: string, reaction: 'up' | 'down') => {
    if (!currentConversation) return;
    setConversations(prev =>
      prev.map(c => {
        if (c.id !== currentConversation.id) return c;
        return {
          ...c,
          messages: c.messages.map(m =>
            m.id === messageId ? { ...m, reaction: m.reaction === reaction ? undefined : reaction } : m
          ),
        };
      })
    );
  };

  const handleToggleReasoning = () => {
    // Switch to DeepSeek R1 if not already on a reasoning model
    if (selectedModelId === 'deepseek-ai/deepseek-r1') {
      setSelectedModelId('meta/llama-3.3-70b-instruct');
    } else {
      setSelectedModelId('deepseek-ai/deepseek-r1');
    }
  };

  const isReasoningActive = currentModel.capabilities.includes('reasoning');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        isOpen={sidebarOpen}
        providerStatus={providerStatus}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePinConversation}
        onOpenSettings={() => setSettingsOpen(true)}
        onCloseSidebar={() => setSidebarOpen(false)}
      />

      {/* Main Chat Layout */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#141416] relative">
        {/* Top Header */}
        <Header
          currentModelId={selectedModelId}
          models={models}
          providerStatus={providerStatus}
          onSelectModel={setSelectedModelId}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenExport={() => setExportOpen(true)}
          onClearConversation={handleClearConversation}
          hasMessages={Boolean(currentConversation && currentConversation.messages.length > 0)}
        />

        {/* Message Thread Scroll Area */}
        <ChatArea
          messages={currentConversation?.messages || []}
          currentModel={currentModel}
          isGenerating={isGenerating}
          onSendPreset={text => handleSendMessage(text)}
          onRegenerate={handleRegenerate}
          onEditMessage={handleEditMessage}
          onReactMessage={handleReactMessage}
        />

        {/* Sticky Input Area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isGenerating={isGenerating}
          onToggleReasoning={handleToggleReasoning}
          isReasoningActive={isReasoningActive}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSaveSettings={newSettings => {
          setSettings(newSettings);
          saveStoredSettings(newSettings);
        }}
        providerStatus={providerStatus}
        onRefreshStatus={refreshStatus}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        conversation={currentConversation}
      />
    </div>
  );
}
