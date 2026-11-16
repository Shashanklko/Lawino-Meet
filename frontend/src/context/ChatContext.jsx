import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import { chatApi } from '../api/chatApi';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '../data/mockData';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [activeConversation, setActiveConversation] = useState(MOCK_CONVERSATIONS[0]);
  const [messages, setMessages] = useState(MOCK_MESSAGES['conv-001'] || []);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(1);
  const stompClientRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await chatApi.getMyConversations();
      if (res.success && res.data && res.data.length > 0) {
        setConversations(res.data);
        const unread = res.data.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
        setUnreadTotal(unread);
      } else {
        setConversations(MOCK_CONVERSATIONS);
      }
    } catch {
      setConversations(MOCK_CONVERSATIONS);
    }
  }, [isAuthenticated]);

  const loadConversationMessages = useCallback(async (conversationPublicId) => {
    try {
      const res = await chatApi.getMessages(conversationPublicId, 0, 50);
      if (res.success && res.data && res.data.content?.length) {
        setMessages(res.data.content || []);
      } else {
        setMessages(MOCK_MESSAGES[conversationPublicId] || MOCK_MESSAGES['conv-001'] || []);
      }
      await chatApi.markConversationAsRead(conversationPublicId);
      setConversations((prev) =>
        prev.map((c) => (c.publicId === conversationPublicId ? { ...c, unreadCount: 0 } : c))
      );
    } catch {
      setMessages(MOCK_MESSAGES[conversationPublicId] || MOCK_MESSAGES['conv-001'] || []);
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

    // Skip websocket connection if using demo token
    if (token.startsWith('mock_demo_token_')) {
      return;
    }

    let client = null;
    try {
      client = new Client({
        webSocketFactory: () => new SockJS('/ws-chat'),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: () => {},
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          client.subscribe('/user/queue/messages', (message) => {
            try {
              const chatMsg = JSON.parse(message.body);
              setMessages((prev) => {
                if (prev.some((m) => m.publicId === chatMsg.publicId)) return prev;
                return [...prev, chatMsg];
              });
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
    } catch {
      // Ignore websocket connection error in test mode
    }

    fetchConversations();

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [isAuthenticated, token, user, fetchConversations]);

  const sendMessage = async (content) => {
    if (!activeConversation || !content.trim()) return;

    const newMsg = {
      publicId: `msg-local-${Date.now()}`,
      senderPublicId: user?.publicId || 'user-me',
      senderName: user?.fullName || 'Me',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);

    const payload = {
      conversationPublicId: activeConversation.publicId,
      content: content.trim(),
    };

    try {
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.publish({
          destination: '/app/chat.send',
          body: JSON.stringify(payload),
        });
      } else {
        await chatApi.sendMessage(activeConversation.publicId, content);
      }
    } catch {
      // Backend not running, simulate automatic legal reply for UI test
      setTimeout(() => {
        const replyMsg = {
          publicId: `msg-reply-${Date.now()}`,
          senderPublicId: activeConversation.targetUser?.publicId || 'adv-reply',
          senderName: activeConversation.targetUser?.fullName || 'Advocate',
          content: 'Noted. I have updated the consultation matter notes accordingly.',
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, replyMsg]);
      }, 1000);
    }
  };

  const sendAttachment = async (file, caption = '') => {
    if (!activeConversation || !file) return;
    try {
      const res = await chatApi.uploadAttachment(activeConversation.publicId, file, caption);
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        return res.data;
      }
    } catch (err) {
      console.warn('Backend upload not available, showing local preview:', err);
      const localMsg = {
        publicId: `msg-doc-${Date.now()}`,
        senderPublicId: user?.publicId || 'client',
        senderName: user?.fullName || user?.username || 'Me',
        content: caption || `[Document: ${file.name}]`,
        attachmentUrl: URL.createObjectURL(file),
        attachmentName: file.name,
        attachmentType: file.type,
        attachmentSize: file.size,
        messageType: file.type?.startsWith('image/') ? 'IMAGE' : 'FILE',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, localMsg]);
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
        return;
      }
    } catch {
      // Fallback
    }

    // Mock conversation fallback
    const targetConv =
      conversations.find((c) => c.targetUser?.publicId === recipientPublicId) || {
        publicId: `conv-${recipientPublicId}`,
        targetUser: {
          publicId: recipientPublicId,
          fullName: recipientName || 'Advocate',
          role: 'LAWYER',
        },
        lastMessage: 'Let us connect on your legal matter.',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
      };

    setActiveConversation(targetConv);
    setIsDrawerOpen(true);
    setMessages(MOCK_MESSAGES['conv-001'] || []);
  };

  const unlockConversation = (conversationPublicId, consultationMode = 'ONLINE', amount = 1500) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.publicId === conversationPublicId) {
          return {
            ...c,
            isLocked: false,
            consultationMode: consultationMode,
            matterTitle:
              consultationMode === 'ONLINE'
                ? 'Online-Video Consultation (WebRTC)'
                : consultationMode === 'CHAMBER'
                ? 'In-Office High Court Chamber Consultation'
                : 'Online Legal Chat Advisory Session',
          };
        }
        return c;
      })
    );

    setActiveConversation((prev) => {
      if (!prev || prev.publicId !== conversationPublicId) return prev;
      return {
        ...prev,
        isLocked: false,
        consultationMode: consultationMode,
        matterTitle:
          consultationMode === 'ONLINE'
            ? 'Online-Video Consultation (WebRTC)'
            : consultationMode === 'CHAMBER'
            ? 'In-Office High Court Chamber Consultation'
            : 'Online Legal Chat Advisory Session',
      };
    });

    const unlockNotice = {
      publicId: `msg-sys-${Date.now()}`,
      senderPublicId: 'system',
      senderName: 'LawinoMeet Escrow',
      content: `Retainer fee of ₹${amount.toLocaleString('en-IN')} held securely in platform escrow. ${
        consultationMode === 'ONLINE'
          ? 'Online-Video Conferencing room and privileged messaging are now active.'
          : consultationMode === 'CHAMBER'
          ? 'In-Office Chamber physical consultation scheduled. Case briefing chat unlocked.'
          : 'Online Legal Chat Service unlocked for 24-hour privileged advice.'
      }`,
      createdAt: new Date().toISOString(),
      isSystemNotice: true,
    };
    setMessages((prev) => [...prev, unlockNotice]);
  };

  const closeConversation = (conversationPublicId) => {
    setConversations((prev) =>
      prev.map((c) => (c.publicId === conversationPublicId ? { ...c, isClosed: true } : c))
    );
    setActiveConversation((prev) => {
      if (!prev || prev.publicId !== conversationPublicId) return prev;
      return { ...prev, isClosed: true };
    });
    const closeNotice = {
      publicId: `msg-sys-${Date.now()}`,
      senderPublicId: 'system',
      senderName: 'LawinoMeet Legal Registry',
      content:
        '⚖️ Consultation Concluded: Presiding counsel marked this legal advisory session completed. This chat room is now closed and preserved under Section 126 statutory privilege.',
      createdAt: new Date().toISOString(),
      isSystemNotice: true,
    };
    setMessages((prev) => [...prev, closeNotice]);
  };

  const selectConversation = (conv) => {
    setActiveConversation(conv);
    setMobileThreadOpen(true);
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
        mobileThreadOpen,
        setMobileThreadOpen,
        setIsDrawerOpen,
        selectConversation,
        openChatWithUser,
        sendMessage,
        sendAttachment,
        fetchConversations,
        unlockConversation,
        closeConversation,
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
