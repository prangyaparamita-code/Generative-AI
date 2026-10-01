import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Sliders,
  Cpu,
  Download,
  PanelLeftClose,
} from 'lucide-react';
import { Conversation, ProviderStatus } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  isOpen: boolean;
  providerStatus: ProviderStatus | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  onOpenSettings: () => void;
  onCloseSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  isOpen,
  providerStatus,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  onOpenSettings,
  onCloseSidebar,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const startRename = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditingTitle(c.title);
  };

  const saveRename = (id: string, e?: React.FormEvent) => {
    e?.preventDefault();
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  // Group conversations chronologically
  const groupedConversations = useMemo(() => {
    const filtered = conversations.filter(c =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const pinned: Conversation[] = [];
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const prev7Days: Conversation[] = [];
    const older: Conversation[] = [];

    for (const c of filtered) {
      if (c.pinned) {
        pinned.push(c);
        continue;
      }
      const diff = now - c.updatedAt;
      if (diff < oneDay) {
        today.push(c);
      } else if (diff < 2 * oneDay) {
        yesterday.push(c);
      } else if (diff < 7 * oneDay) {
        prev7Days.push(c);
      } else {
        older.push(c);
      }
    }

    return { pinned, today, yesterday, prev7Days, older };
  }, [conversations, searchQuery]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"
          onClick={onCloseSidebar}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 sm:w-72 bg-zinc-950 flex flex-col border-r border-zinc-800/80 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header: Logo + New Chat */}
        <div className="p-3 border-b border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm tracking-wider">
                NX
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-zinc-100 tracking-tight leading-tight">
                  NexusAI
                </span>
                <span className="text-[10px] text-zinc-400 leading-tight">
                  ChatGPT + NVIDIA NIM
                </span>
              </div>
            </div>

            <button
              onClick={onCloseSidebar}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg md:hidden transition-colors"
              title="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewConversation();
              if (window.innerWidth < 768) onCloseSidebar();
            }}
            className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 hover:bg-zinc-800/80 active:bg-zinc-800 border border-zinc-800 hover:border-zinc-700/80 text-zinc-200 rounded-lg transition-all group shadow-xs"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>New chat</span>
            </div>
            <kbd className="hidden sm:inline-block text-[10px] font-mono text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
              ⌘K
            </kbd>
          </button>

          {/* Search Bar */}
          {conversations.length > 3 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800/70 text-xs text-zinc-200 placeholder-zinc-500 pl-8 pr-2.5 py-1.5 rounded-lg focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs text-zinc-400">
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center text-zinc-500 space-y-1">
              <MessageSquare className="w-5 h-5 mx-auto text-zinc-600 mb-2" />
              <p className="text-xs">No conversations yet</p>
              <p className="text-[11px] text-zinc-600">Start asking questions or code</p>
            </div>
          ) : (
            <>
              {/* Pinned */}
              {groupedConversations.pinned.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Pin className="w-3 h-3 text-amber-400" />
                    <span>Pinned</span>
                  </div>
                  {groupedConversations.pinned.map(c => renderItem(c))}
                </div>
              )}

              {/* Today */}
              {groupedConversations.today.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Today
                  </div>
                  {groupedConversations.today.map(c => renderItem(c))}
                </div>
              )}

              {/* Yesterday */}
              {groupedConversations.yesterday.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Yesterday
                  </div>
                  {groupedConversations.yesterday.map(c => renderItem(c))}
                </div>
              )}

              {/* Previous 7 Days */}
              {groupedConversations.prev7Days.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Previous 7 Days
                  </div>
                  {groupedConversations.prev7Days.map(c => renderItem(c))}
                </div>
              )}

              {/* Older */}
              {groupedConversations.older.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Older
                  </div>
                  {groupedConversations.older.map(c => renderItem(c))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Section: API status + Parameters trigger */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 space-y-2">
          {/* Provider status badge */}
          <div className="px-2 py-1.5 bg-zinc-900/60 rounded-lg border border-zinc-800/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${providerStatus?.nvidiaAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-zinc-300 font-medium">NVIDIA NIM Ready</span>
            </div>
            <span className="text-zinc-500 font-mono text-[10px]">v1 REST/SSE</span>
          </div>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-800"
          >
            <Sliders className="w-4 h-4 text-zinc-400" />
            <span>Settings & Instructions</span>
          </button>
        </div>
      </aside>
    </>
  );

  function renderItem(c: Conversation) {
    const isActive = c.id === activeId;
    const isEditing = c.id === editingId;

    if (isEditing) {
      return (
        <form
          key={c.id}
          onSubmit={e => saveRename(c.id, e)}
          className="flex items-center gap-1 px-2 py-1 bg-zinc-900 border border-emerald-500/50 rounded-lg"
        >
          <input
            type="text"
            value={editingTitle}
            onChange={e => setEditingTitle(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-xs text-zinc-100 focus:outline-none"
          />
          <button
            type="submit"
            className="p-1 text-emerald-400 hover:text-emerald-300 rounded"
            title="Save"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setEditingId(null)}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      );
    }

    return (
      <div
        key={c.id}
        onClick={() => {
          onSelectConversation(c.id);
          if (window.innerWidth < 768) onCloseSidebar();
        }}
        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-xs ${
          isActive
            ? 'bg-zinc-800/90 text-zinc-100 font-medium'
            : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
        }`}
      >
        <div className="flex items-center gap-2 truncate mr-2">
          {c.pinned ? (
            <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <MessageSquare className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          )}
          <span className="truncate">{c.title || 'Untitled Chat'}</span>
        </div>

        {/* Hover quick actions */}
        <div className="hidden group-hover:flex items-center gap-1 shrink-0 bg-zinc-800/90 pl-1 rounded">
          <button
            onClick={e => {
              e.stopPropagation();
              onTogglePinConversation(c.id);
            }}
            className={`p-1 hover:text-zinc-100 rounded transition-colors ${
              c.pinned ? 'text-amber-400' : 'text-zinc-400'
            }`}
            title={c.pinned ? 'Unpin' : 'Pin to top'}
          >
            <Pin className="w-3 h-3" />
          </button>

          <button
            onClick={e => startRename(c, e)}
            className="p-1 text-zinc-400 hover:text-zinc-100 rounded transition-colors"
            title="Rename"
          >
            <Edit2 className="w-3 h-3" />
          </button>

          <button
            onClick={e => {
              e.stopPropagation();
              onDeleteConversation(c.id);
            }}
            className="p-1 text-zinc-400 hover:text-rose-400 rounded transition-colors"
            title="Delete conversation"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }
};
