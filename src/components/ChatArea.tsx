import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  ChevronDown,
  ChevronRight,
  BrainCircuit,
  ArrowDown,
  Code,
  Lightbulb,
  Cpu,
  Compass,
} from 'lucide-react';
import { Message, ModelInfo, Attachment } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatAreaProps {
  messages: Message[];
  currentModel: ModelInfo;
  isGenerating: boolean;
  onSendPreset: (text: string) => void;
  onRegenerate: () => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onReactMessage: (messageId: string, reaction: 'up' | 'down') => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  currentModel,
  isGenerating,
  onSendPreset,
  onRegenerate,
  onEditMessage,
  onReactMessage,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});

  // Auto-scroll to bottom on new messages or chunks
  useEffect(() => {
    if (scrollRef.current && !showScrollBottom) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isGenerating]);

  // Track scroll position for "Scroll to bottom" button
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setShowScrollBottom(distanceFromBottom > 150);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setShowScrollBottom(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  // Text to speech
  const toggleSpeech = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/```[\s\S]*?```/g, 'Code block omitted.');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const toggleReasoning = (id: string) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleStartEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditingText(msg.content);
  };

  const handleSaveEdit = (msgId: string) => {
    if (editingText.trim()) {
      onEditMessage(msgId, editingText.trim());
    }
    setEditingId(null);
  };

  const starterSuggestions = [
    {
      icon: <Code className="w-4 h-4 text-emerald-400" />,
      title: 'Full-Stack Architecture',
      prompt: 'Write a production-ready Node.js & TypeScript microservice with rate limiting and connection pooling.',
    },
    {
      icon: <BrainCircuit className="w-4 h-4 text-purple-400" />,
      title: 'DeepSeek R1 Reasoning',
      prompt: 'Explain how reinforcement learning and chain-of-thought verification work inside DeepSeek R1 and reasoning models.',
    },
    {
      icon: <Cpu className="w-4 h-4 text-emerald-400" />,
      title: 'NVIDIA NIM Capabilities',
      prompt: 'How do NVIDIA NIM microservices optimize GPU inference throughput with TensorRT-LLM and KV-cache caching?',
    },
    {
      icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
      title: 'Algorithm Optimization',
      prompt: 'Provide an optimal algorithm in Python to detect cycles in a directed graph with time and space complexity analysis.',
    },
  ];

  return (
    <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-zinc-700/60"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Empty State */}
          {messages.length === 0 ? (
            <div className="py-12 md:py-20 flex flex-col items-center text-center space-y-6">
              {/* Brand icon */}
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg relative group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                  NX
                </div>
              </div>

              <div className="space-y-2 max-w-lg">
                <h1 className="text-2xl md:text-3xl font-semibold text-zinc-100 tracking-tight">
                  What can I help with today?
                </h1>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Running <strong className="text-zinc-200">{currentModel.name}</strong>. Powered by NVIDIA NIM and state-of-the-art open models with instant streaming.
                </p>
              </div>

              {/* Starter Suggestions */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-left">
                {starterSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendPreset(item.prompt)}
                    className="p-3.5 bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all group flex flex-col justify-between text-left space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="font-medium text-xs text-zinc-200 group-hover:text-white">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Messages List
            messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const isAssistant = msg.role === 'assistant';
              const hasReasoning = Boolean(msg.reasoningContent);
              const isReasoningOpen = expandedReasoning[msg.id] ?? false;

              if (isUser) {
                return (
                  <div key={msg.id} className="flex justify-end group">
                    <div className="max-w-[85%] sm:max-w-[75%] space-y-1.5">
                      {/* User Bubble */}
                      <div className="bg-zinc-800 text-zinc-100 rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-sm text-[15px] leading-relaxed break-words">
                        {editingId === msg.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingText}
                              onChange={e => setEditingText(e.target.value)}
                              className="w-full bg-zinc-900 text-zinc-100 text-sm p-2 rounded border border-zinc-600 focus:outline-none focus:border-emerald-500 resize-none min-h-[70px]"
                            />
                            <div className="flex justify-end gap-2 text-xs">
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-2.5 py-1 text-zinc-400 hover:text-zinc-200 rounded"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(msg.id)}
                                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded transition-colors"
                              >
                                Save & Submit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Attachments if any */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2 pb-2 border-b border-zinc-700/60">
                                {msg.attachments.map((att: Attachment) => (
                                  <div
                                    key={att.id}
                                    className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900/80 rounded text-xs text-zinc-300"
                                  >
                                    <span className="truncate max-w-[140px]">{att.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          </>
                        )}
                      </div>

                      {/* User Actions */}
                      {editingId !== msg.id && (
                        <div className="flex items-center justify-end gap-1 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs pr-1">
                          <button
                            onClick={() => handleStartEdit(msg)}
                            className="p-1 hover:text-zinc-300 rounded"
                            title="Edit message"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="p-1 hover:text-zinc-300 rounded"
                            title="Copy text"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Assistant message
              return (
                <div key={msg.id} className="flex gap-3 group items-start">
                  {/* Model Avatar */}
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                    {msg.provider === 'gemini' ? (
                      <Sparkles className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Cpu className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>

                  {/* Assistant Body */}
                  <div className="flex-1 space-y-2 min-w-0">
                    {/* Header info: Model tag */}
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="font-medium text-zinc-400">
                        {msg.model || currentModel.name}
                      </span>
                      {msg.latencyMs ? (
                        <>
                          <span>·</span>
                          <span>{(msg.latencyMs / 1000).toFixed(1)}s</span>
                        </>
                      ) : null}
                    </div>

                    {/* Reasoning Accordion (DeepSeek R1 / Nemotron) */}
                    {hasReasoning && (
                      <div className="border border-purple-500/20 bg-purple-950/15 rounded-lg overflow-hidden my-2">
                        <button
                          onClick={() => toggleReasoning(msg.id)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-purple-300 hover:bg-purple-900/20 transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                            <span>Thinking Process</span>
                          </div>
                          {isReasoningOpen ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {isReasoningOpen && (
                          <div className="p-3 text-xs text-purple-200/80 font-mono bg-zinc-950/60 border-t border-purple-500/20 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                            {msg.reasoningContent}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Main Content */}
                    <div className="prose prose-invert max-w-none">
                      {msg.content ? (
                        <MarkdownRenderer content={msg.content} />
                      ) : (
                        isGenerating && idx === messages.length - 1 && (
                          <div className="flex items-center gap-2 text-zinc-400 text-sm py-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            <span>Thinking...</span>
                          </div>
                        )
                      )}

                      {/* Streaming cursor */}
                      {isGenerating && idx === messages.length - 1 && msg.content && (
                        <span className="inline-block w-2 h-4 bg-emerald-400 align-middle ml-1 animate-pulse" />
                      )}
                    </div>

                    {/* Error display if any */}
                    {msg.status === 'error' && (
                      <div className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-lg text-xs text-rose-300">
                        {msg.errorMessage || 'An error occurred during response generation.'}
                      </div>
                    )}

                    {/* Action Bar */}
                    {msg.content && (
                      <div className="flex items-center gap-2 text-zinc-500 pt-1 text-xs">
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="p-1.5 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-md transition-colors"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => toggleSpeech(msg.content, msg.id)}
                          className={`p-1.5 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-md transition-colors ${
                            speakingId === msg.id ? 'text-emerald-400' : ''
                          }`}
                          title={speakingId === msg.id ? 'Stop reading' : 'Read aloud'}
                        >
                          {speakingId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => onReactMessage(msg.id, 'up')}
                          className={`p-1.5 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-md transition-colors ${
                            msg.reaction === 'up' ? 'text-emerald-400' : ''
                          }`}
                          title="Good response"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onReactMessage(msg.id, 'down')}
                          className={`p-1.5 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-md transition-colors ${
                            msg.reaction === 'down' ? 'text-rose-400' : ''
                          }`}
                          title="Poor response"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>

                        {idx === messages.length - 1 && !isGenerating && (
                          <button
                            onClick={onRegenerate}
                            className="p-1.5 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-md transition-colors flex items-center gap-1"
                            title="Regenerate response"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-6 w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shadow-xl border border-zinc-700/80 flex items-center justify-center transition-all z-10 hover:scale-105"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
