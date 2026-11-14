import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ArrowLeft, MessageSquare } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

export const ChatDrawer = () => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    messages,
    isDrawerOpen,
    setIsDrawerOpen,
    selectConversation,
    sendMessage,
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isDrawerOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const msg = inputMessage;
    setInputMessage('');
    await sendMessage(msg);
  };

  const getOtherParticipantName = (conv) => {
    if (!conv || !conv.participants) return 'Chat';
    const other = conv.participants.find((p) => p.userPublicId !== user?.publicId);
    return other?.username || 'Advocate';
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200">
      {/* Drawer Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {activeConversation && (
            <button
              onClick={() => selectConversation(null)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-sm">
            {activeConversation ? getOtherParticipantName(activeConversation) : 'Messages'}
          </h3>
        </div>
        <button
          onClick={() => setIsDrawerOpen(false)}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Content */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs text-center">
                No messages yet. Send a message to start consultation.
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderPublicId === user?.publicId;
                return (
                  <div
                    key={msg.publicId || msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {msg.sentAt
                        ? new Date(msg.sentAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Just now'}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2 rounded-lg bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* Conversation List */
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No conversations yet.</p>
              <p className="mt-1">Connect with an advocate to start a conversation.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.publicId}
                onClick={() => selectConversation(conv)}
                className="p-3.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    {getOtherParticipantName(conv)?.[0]?.toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {getOtherParticipantName(conv)}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {conv.lastMessageSnippet || 'No messages yet'}
                    </p>
                  </div>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
