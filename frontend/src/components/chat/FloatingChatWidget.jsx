import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Minus,
  Send,
  Video,
  ShieldCheck,
  Paperclip,
  CheckCheck,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export const FloatingChatWidget = () => {
  const { user, isAuthenticated } = useAuth();
  const { theme, currentTheme } = useTheme();
  const {
    conversations,
    activeConversation,
    messages,
    sendMessage,
    selectConversation,
    unreadTotal,
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('lawino_chat_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const handleDismiss = () => {
    setIsOpen(false);
    setIsDismissed(true);
    try {
      sessionStorage.setItem('lawino_chat_dismissed', 'true');
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleLaunchMeeting = () => {
    const roomId = activeConversation?.meetingRoomPublicId || activeConversation?.appointmentPublicId || activeConversation?.publicId || 'chamber_consultation';
    navigate(`/meeting/${roomId}`);
    setIsOpen(false);
  };

  if (!isAuthenticated || user?.role === 'FIRM_ADMIN') return null;

  // When dismissed or closed, completely remove the widget
  if (isDismissed) return null;

  // Initially remove floating chat unless any new unread message appears or user opened it
  if (!isOpen && unreadTotal === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Floating Chat Dock */}
      {isOpen && (
        <div className="mb-3 w-84 sm:w-96 h-[500px] bg-white/95 backdrop-blur-2xl border border-stone-200/90 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 transition-all duration-300">
          {/* Header */}
          <div className="bg-[var(--bg-cream-soft)] p-3 px-4 border-b border-stone-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-[var(--bg-primary)] text-white flex items-center justify-center font-serif font-bold text-xs shadow-xs">
                  {activeConversation?.targetUser?.fullName?.[0] || 'A'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <div className="overflow-hidden">
                <h4 className="text-xs font-serif font-bold text-[#1F1C1B] truncate">
                  {activeConversation?.targetUser?.fullName || 'Legal Counsel'}
                </h4>
                <p className="text-[10px] text-stone-500 font-mono flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
                  <span>Privileged Encrypted Chat</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              <button
                type="button"
                onClick={handleLaunchMeeting}
                className="p-1.5 rounded-lg hover:bg-stone-200/60 text-stone-600 hover:text-[var(--bg-primary)] transition cursor-pointer"
                title="Enter Video Consultation Room"
              >
                <Video className="w-4 h-4 text-[var(--bg-primary)]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/messages');
                }}
                className="p-1.5 rounded-lg hover:bg-stone-200/60 text-stone-600 hover:text-[var(--bg-primary)] transition cursor-pointer"
                title="Open Full Messages Page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-200/60 text-stone-600 transition cursor-pointer"
                title="Minimize Chat Box"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-700 transition cursor-pointer"
                title="Close and remove chat widget"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Thread Tabs */}
          {conversations.length > 1 && (
            <div className="bg-[var(--bg-cream-soft)]/90 px-3 py-1.5 border-b border-stone-200/70 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
              <span className="text-[10px] uppercase font-bold text-stone-400 shrink-0">Threads:</span>
              {conversations.map((c) => {
                const isSelected = activeConversation?.publicId === c.publicId;
                return (
                  <button
                    key={c.publicId}
                    type="button"
                    onClick={() => selectConversation(c)}
                    className={`px-2.5 py-1 rounded-lg font-medium truncate max-w-[140px] transition cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-[var(--bg-primary)] text-white shadow-xs'
                        : 'bg-white/80 text-stone-700 hover:bg-white border border-stone-200/60'
                    }`}
                  >
                    {c.targetUser?.fullName?.split(' ')[1] || c.targetUser?.fullName}
                  </button>
                );
              })}
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-gradient-to-b from-white/70 to-[var(--bg-cream-soft)]/70">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2">
                <MessageSquare className="w-8 h-8 text-stone-300" />
                <p className="text-xs">No messages yet. Send a query regarding your consultation or case documents.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderPublicId === user?.publicId;
                return (
                  <div
                    key={msg.publicId}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-xs ${
                        isMe
                          ? 'bg-[var(--bg-primary)] text-white rounded-tr-none'
                          : 'bg-white text-stone-800 border border-stone-200/70 rounded-tl-none'
                      }`}
                    >
                      {!isMe && (
                        <p className="text-[10px] font-bold text-[var(--bg-primary)] mb-0.5">
                          {msg.senderName}
                        </p>
                      )}
                      <p className="leading-relaxed font-sans">{msg.content}</p>
                      <div
                        className={`flex items-center justify-end space-x-1 mt-1 text-[9px] ${
                          isMe ? 'text-white/70' : 'text-stone-400'
                        }`}
                      >
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMe && <CheckCheck className="w-3 h-3 text-white/90" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-stone-200/70 flex items-center space-x-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type privileged message or query..."
              className="flex-1 bg-[var(--bg-cream-soft)] border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[var(--bg-primary)] focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 disabled:opacity-40 text-white transition shadow-xs cursor-pointer"
              title="Send Message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Trigger Pill / Button with explicit close option */}
      <div className="flex items-center bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ring-1 ring-black/5 pl-1 pr-2 py-1">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-2 py-1 text-[#1F1C1B] hover:text-[var(--bg-primary)] transition cursor-pointer"
          title="Toggle Counsel Chat"
        >
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-[var(--bg-primary)] text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            {unreadTotal > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--bg-primary)] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadTotal}
              </span>
            )}
          </div>

          <div className="text-left hidden sm:block pr-1">
            <div className="text-xs font-serif font-bold text-[#1F1C1B] hover:text-[var(--bg-primary)] transition">
              Counsel Chat
            </div>
          </div>
        </button>

        {/* Explicit Close / Dismiss Button - Permanently removes widget */}
        <button
          type="button"
          onClick={handleDismiss}
          className="w-6 h-6 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition cursor-pointer ml-1"
          title="Close and remove chat widget"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
