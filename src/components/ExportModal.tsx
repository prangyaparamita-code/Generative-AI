import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, Code2 } from 'lucide-react';
import { Conversation } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  conversation,
}) => {
  const [format, setFormat] = useState<'markdown' | 'json' | 'text'>('markdown');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !conversation) return null;

  const generateExportContent = (): string => {
    if (format === 'json') {
      return JSON.stringify(conversation, null, 2);
    }

    if (format === 'markdown') {
      let md = `# ${conversation.title}\n\n`;
      md += `*Model:* ${conversation.modelId}\n`;
      md += `*Date:* ${new Date(conversation.createdAt).toLocaleString()}\n\n---\n\n`;

      for (const msg of conversation.messages) {
        const roleName = msg.role === 'user' ? 'User' : 'Assistant';
        md += `### ${roleName}\n\n${msg.content}\n\n`;
        if (msg.reasoningContent) {
          md += `> **Reasoning Trace:**\n> ${msg.reasoningContent.replace(/\n/g, '\n> ')}\n\n`;
        }
      }
      return md;
    }

    // Plain text
    let txt = `${conversation.title}\n${'='.repeat(conversation.title.length)}\n\n`;
    for (const msg of conversation.messages) {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      txt += `[${role}]:\n${msg.content}\n\n`;
    }
    return txt;
  };

  const content = generateExportContent();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const ext = format === 'markdown' ? 'md' : format === 'json' ? 'json' : 'txt';
    const mime =
      format === 'json'
        ? 'application/json'
        : format === 'markdown'
        ? 'text/markdown'
        : 'text/plain';

    const safeTitle = conversation.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
    const filename = `${safeTitle || 'conversation'}.${ext}`;

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-zinc-100">Export Conversation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Format Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">Export Format</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat('markdown')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  format === 'markdown'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Markdown (.md)
              </button>
              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  format === 'json'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                JSON (.json)
              </button>
              <button
                type="button"
                onClick={() => setFormat('text')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  format === 'text'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Text (.txt)
              </button>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Preview</label>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-[11px] text-zinc-400 whitespace-pre-wrap leading-relaxed">
              {content.slice(0, 1000)}
              {content.length > 1000 && '...'}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy to Clipboard</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
