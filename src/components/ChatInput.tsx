import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Mic,
  MicOff,
  BrainCircuit,
  X,
  FileCode,
  FileText,
} from 'lucide-react';
import { Attachment } from '../types';

interface ChatInputProps {
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  onStopGeneration: () => void;
  isGenerating: boolean;
  disabled?: boolean;
  onToggleReasoning?: () => void;
  isReasoningActive?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isGenerating,
  disabled,
  onToggleReasoning,
  isReasoningActive,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 48), 200)}px`;
    }
  }, [input]);

  // Focus textarea on load
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isGenerating || disabled) return;
    onSendMessage(input.trim(), attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }
  };

  // Handle file uploads
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isText = file.type.startsWith('text/') ||
        file.name.endsWith('.ts') ||
        file.name.endsWith('.tsx') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.jsx') ||
        file.name.endsWith('.py') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.sql');

      if (isText) {
        const textContent = await file.text();
        newAttachments.push({
          id: 'att_' + Date.now() + '_' + i,
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          textContent,
        });
      } else {
        // Data URL for images
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newAttachments.push({
          id: 'att_' + Date.now() + '_' + i,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
        });
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Web Speech API Voice Input
  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInput(prev => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* File Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-zinc-900/80 rounded-lg border border-zinc-800">
          {attachments.map(att => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 border border-zinc-700/80 rounded-md text-xs text-zinc-200"
            >
              {att.textContent ? (
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="max-w-[160px] truncate">{att.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="text-zinc-400 hover:text-rose-400 ml-1"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Box */}
      <div className="relative flex flex-col bg-zinc-900/90 border border-zinc-700/70 hover:border-zinc-600 focus-within:border-zinc-500 rounded-2xl shadow-xl transition-all overflow-hidden">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          accept=".txt,.md,.py,.js,.jsx,.ts,.tsx,.json,.csv,.sql,.html,.css,image/*"
        />

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message NexusAI or paste code..."
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 px-4 pt-3.5 pb-2 text-[15px] resize-none focus:outline-none min-h-[48px] max-h-[220px] scrollbar-thin scrollbar-thumb-zinc-700"
        />

        {/* Action Toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          {/* Left tools: Attachment, Reasoning mode, Voice */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Attach code, text or documents"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {onToggleReasoning && (
              <button
                type="button"
                onClick={onToggleReasoning}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isReasoningActive
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
                }`}
                title="Toggle Deep Reasoning Model (DeepSeek R1 / Nemotron)"
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reason</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-lg transition-colors ${
                isListening
                  ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              title={isListening ? 'Stop listening' : 'Voice input (Speech to text)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Right tool: Send / Stop button */}
          <div className="flex items-center gap-2">
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-white text-zinc-900 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={(!input.trim() && attachments.length === 0) || disabled}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  input.trim() || attachments.length > 0
                    ? 'bg-white hover:bg-zinc-200 text-zinc-900 shadow-md hover:scale-105 active:scale-95'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
                title="Send message (Enter)"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="text-center mt-2 text-[11px] text-zinc-500">
        NexusAI supports NVIDIA NIM models via <span className="text-emerald-400">NVIDIA_API_KEY</span> & Google Gemini. Verify critical information.
      </div>
    </div>
  );
};
