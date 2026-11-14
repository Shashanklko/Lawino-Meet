import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import { chatApi } from '../api/chatApi';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const stompClientRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await chatApi.getMyConversations();
      if (res.success && res.data) {
        setConversations(res.data);
        const unread = res.data.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
        setUnreadTotal(unread);
      }
    } catch (err) {
      console.warn('Failed to fetch conversations:', err);
    }
  }, [isAuthenticated]);

  const loadConversationMessages = useCallback(async (conversationPublicId) => {
    try {
      const res = await chatApi.getMessages(conversationPublicId, 0, 50);
      if (res.success && res.data) {
        setMessages(res.data.content || []);
      }
      await chatApi.markConversationAsRead(conversationPublicId);
      setConversations((prev) =>
        prev.map((c) => (c.publicId === conversationPublicId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  // Setup STOMP WebSocket connection for real-time messaging
  useEffect(() => {
    if (!isAuthenticated || !token || !user) {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws-chat'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        // Subscribe to user personal queue
        client.subscribe('/user/queue/messages', (message) => {
          try {
            const chatMsg = JSON.parse(message.body);
            setMessages((prev) => {
              if (prev.some((m) => m.publicId === chatMsg.publicId)) return prev;
              return [...prev, chatMsg];
            });

            // Refresh conversations list to update latest preview and unread count
            fetchConversations();
          } catch (err) {
            console.error('Error handling incoming STOMP message:', err);
          }
        });
      },
      onStompError: (frame) => {
        console.warn('STOMP broker error:', frame.headers['message']);
      },
    });

    client.activate();
    stompClientRef.current = client;

    fetchConversations();

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [isAuthenticated, token, user, fetchConversations]);

  const sendMessage = async (content) => {
    if (!activeConversation || !content.trim()) return;

    const payload = {
      conversationPublicId: activeConversation.publicId,
      content: content.trim(),
    };

    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(payload),
      });
    } else {
      // Fallback to REST
      const res = await chatApi.sendMessage(activeConversation.publicId, content);
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        fetchConversations();
      }
    }
  };

  const openChatWithUser = async (recipientPublicId, recipientName) => {
    try {
      const res = await chatApi.getOrCreateConversation(recipientPublicId);
      if (res.success && res.data) {
        const conv = res.data;
        setActiveConversation(conv);
        setIsDrawerOpen(true);
        await loadConversationMessages(conv.publicId);
      }
    } catch (err) {
      console.error('Failed to open chat with user:', err);
    }
  };

  const selectConversation = (conv) => {
    setActiveConversation(conv);
    loadConversationMessages(conv.publicId);
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        isDrawerOpen,
        unreadTotal,
        setIsDrawerOpen,
        selectConversation,
        openChatWithUser,
        sendMessage,
        fetchConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
