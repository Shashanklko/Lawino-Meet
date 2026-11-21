import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import { chatApi } from '../api/chatApi';

const ChatContext = createContext(null);

const KNOWN_USERS = {
  adv_raghavan: {
    fullName: 'Adv. Raghavan Nambiar',
    role: 'LAWYER',
    profileImageUrl: null,
    designation: 'Senior Partner',
    firmName: 'Lex Veritas Legal LLP',
  },
  adv_meera: {
    fullName: 'Adv. Meera Deshmukh',
    role: 'LAWYER',
    profileImageUrl: null,
    designation: 'Criminal Defense Counsel',
    firmName: 'Independent High Court Chambers',
  },
  adv_ananya: {
    fullName: 'Adv. Ananya Sengupta',
    role: 'LAWYER',
    profileImageUrl: null,
    designation: 'Corporate & Tech Specialist',
    firmName: 'Startup Legal Desks',
  },
  adv_vikram: {
    fullName: 'Adv. Vikramaditya Rathore',
    role: 'LAWYER',
    profileImageUrl: null,
    designation: 'Family & Matrimonial Litigator',
    firmName: 'Delhi High Court Complex',
  },
  adv_rohan: {
    fullName: 'Adv. Rohan Kulkarni',
    role: 'LAWYER',
    profileImageUrl: null,
    designation: 'Cybercrime & IT Counsel',
    firmName: 'Digital Forensics Desk',
  },
  rohit_client: {
    fullName: 'Rohit Verma',
    role: 'CLIENT',
    profileImageUrl: null,
  },
  priya_client: {
    fullName: 'Priya Sharma',
    role: 'CLIENT',
    profileImageUrl: null,
  },
  amit_client: {
    fullName: 'Amit Patel',
    role: 'CLIENT',
    profileImageUrl: null,
  },
  vikas_client: {
    fullName: 'Vikas Verma',
    role: 'CLIENT',
    profileImageUrl: null,
  },
  sunita_client: {
    fullName: 'Sunita Rao',
    role: 'CLIENT',
    profileImageUrl: null,
  },
  // Mappings by publicId
  '33333333-3333-3333-3333-333333333333': {
    fullName: 'Adv. Raghavan Nambiar',
    role: 'LAWYER',
    username: 'adv_raghavan',
    profileImageUrl: null,
    designation: 'Senior Partner',
    firmName: 'Lex Veritas Legal LLP',
  },
  '22222222-2222-2222-2222-222222222222': {
    fullName: 'Adv. Meera Deshmukh',
    role: 'LAWYER',
    username: 'adv_meera',
    profileImageUrl: null,
    designation: 'Criminal Defense Counsel',
    firmName: 'Independent High Court Chambers',
  },
  '11111111-1111-1111-1111-111111111111': {
    fullName: 'Rohit Verma',
    role: 'CLIENT',
    username: 'rohit_client',
    profileImageUrl: null,
  },
};

export const resolveUserIdentity = (username, publicId) => {
  if (publicId && KNOWN_USERS[publicId]) {
    return { ...KNOWN_USERS[publicId], publicId };
  }
  if (username && KNOWN_USERS[username]) {
    return { ...KNOWN_USERS[username], username, publicId };
  }
  if (!username) {
    if (publicId) {
      return { fullName: `User (${publicId.slice(0, 8)})`, role: 'CLIENT', username: `user_${publicId.slice(0, 8)}`, publicId, profileImageUrl: null };
    }
    return { fullName: 'Legal Contact', role: 'CLIENT', username: 'contact', publicId, profileImageUrl: null };
  }
  if (username.startsWith('adv_')) {
    const raw = username.replace(/^adv_/, '').replace(/_/g, ' ');
    const formatted = raw
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { fullName: `Adv. ${formatted}`, role: 'LAWYER', username, publicId, profileImageUrl: null };
  }
  if (username.endsWith('_client')) {
    const raw = username.replace(/_client$/, '').replace(/_/g, ' ');
    const formatted = raw
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { fullName: formatted, role: 'CLIENT', username, publicId, profileImageUrl: null };
  }
  const formatted = username
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { fullName: formatted, role: 'CLIENT', username, publicId, profileImageUrl: null };
};

export const normalizeConversation = (c) => {
  const targetUsername = c.otherParticipantUsername || c.targetUser?.username;
  const targetPublicId = c.otherParticipantPublicId || c.targetUser?.publicId;
  const resolved = resolveUserIdentity(targetUsername, targetPublicId);
  const unreadCount = Number(c.unreadMessagesCount ?? c.unreadCount ?? 0);

  let finalFullName = resolved.fullName;
  if (c.targetUser?.fullName && c.targetUser.fullName !== 'Legal Contact') {
    finalFullName = c.targetUser.fullName;
  } else if (c.otherParticipantFullName) {
    finalFullName = c.otherParticipantFullName;
  }

  return {
    ...c,
    publicId: c.publicId,
    appointmentPublicId: c.appointmentPublicId,
    isClosed: Boolean(c.isClosed || c.closed),
    lastMessage: c.lastMessageContent || c.lastMessage || '',
    lastMessageAt: c.lastMessageAt || null,
    unreadCount,
    unreadMessagesCount: unreadCount,
    targetUser: {
      publicId: targetPublicId,
      username: targetUsername,
      fullName: finalFullName,
      profileImageUrl: c.targetUser?.profileImageUrl || resolved.profileImageUrl,
      role: c.targetUser?.role || resolved.role,
      firmName: resolved.firmName || c.targetUser?.firmName,
      designation: resolved.designation || c.targetUser?.designation,
    },
  };
};

// Deduplicate messages across REST, WebSocket, and optimistic dispatches
const addOrUpdateMessage = (prev, newMsg) => {
  if (!newMsg || !newMsg.publicId) return prev;
  if (newMsg.deletedForMe) {
    return prev.filter((m) => m.publicId !== newMsg.publicId);
  }

  // 1. If message with exact publicId already exists, update in place (e.g. deleted for everyone)
  const existingIdx = prev.findIndex((m) => m.publicId === newMsg.publicId);
  if (existingIdx !== -1) {
    const next = [...prev];
    next[existingIdx] = { ...next[existingIdx], ...newMsg };
    return next;
  }

  // 2. If there is an optimistic local message with matching sender and content sent recently
  const optimisticIdx = prev.findIndex(
    (m) =>
      m.publicId?.startsWith('msg-local-') &&
      m.senderUserPublicId === newMsg.senderUserPublicId &&
      m.content === newMsg.content
  );
  if (optimisticIdx !== -1) {
    const next = [...prev];
    next[optimisticIdx] = newMsg;
    return next;
  }

  // 3. Double-check for duplicate content/sender within 4 seconds window
  const newTime = new Date(newMsg.createdAt || Date.now()).getTime();
  const isDuplicate = prev.some(
    (m) =>
      m.senderUserPublicId === newMsg.senderUserPublicId &&
      m.content === newMsg.content &&
      Math.abs(new Date(m.createdAt || Date.now()).getTime() - newTime) < 4000
  );
  if (isDuplicate) {
    return prev;
  }

  return [...prev, newMsg];
};

export const ChatProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const stompClientRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await chatApi.getMyConversations();
      const rawList = res?.data || [];
      const normalizedList = rawList.map(normalizeConversation);
      // Deduplicate conversations per other participant so duplicate threads never appear in sidebar
      const dedupedMap = new Map();
      normalizedList.forEach((c) => {
        const key = c.targetUser?.publicId || c.publicId;
        if (!dedupedMap.has(key)) {
          dedupedMap.set(key, c);
        } else {
          const existing = dedupedMap.get(key);
          const tNew = new Date(c.lastMessageAt || c.createdAt || 0).getTime();
          const tExisting = new Date(existing.lastMessageAt || existing.createdAt || 0).getTime();
          if (tNew > tExisting) {
            dedupedMap.set(key, c);
          }
        }
      });
      const uniqueList = Array.from(dedupedMap.values());
      setConversations(uniqueList);
      const totalUnread = uniqueList.reduce(
        (acc, c) => acc + (c.unreadCount || c.unreadMessagesCount || 0),
        0
      );
      setUnreadTotal(totalUnread);

      // If active conversation is open, update its reference
      setActiveConversation((prev) => {
        if (!prev) return uniqueList[0] || null;
        const matching = uniqueList.find((c) => c.publicId === prev.publicId) ||
          uniqueList.find((c) => c.targetUser?.publicId === prev.targetUser?.publicId);
        return matching ? { ...prev, ...matching } : prev;
      });
    } catch {
      setConversations([]);
    }
  }, [isAuthenticated]);

  const loadConversationMessages = useCallback(async (conversationPublicId) => {
    try {
      const res = await chatApi.getMessages(conversationPublicId, 0, 50);
      const list = res?.data?.content || (Array.isArray(res?.data) ? res.data : []);
      setMessages(list);
      await chatApi.markConversationAsRead(conversationPublicId);
      setConversations((prev) =>
        prev.map((c) =>
          c.publicId === conversationPublicId ? { ...c, unreadCount: 0, unreadMessagesCount: 0 } : c
        )
      );
      setUnreadTotal((prev) => Math.max(0, prev - 1));
    } catch {
      setMessages([]);
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

    if (token.startsWith('mock_demo_token_')) {
      return;
    }

    let client = null;
    const handleIncomingChatMessage = (message) => {
      try {
        const chatMsg = JSON.parse(message.body);
        setMessages((prev) => addOrUpdateMessage(prev, chatMsg));
        fetchConversations();
      } catch (err) {
        console.error('Error handling incoming STOMP message:', err);
      }
    };

    try {
      client = new Client({
        webSocketFactory: () => new SockJS('/ws-chat'),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: () => {},
        reconnectDelay: 3000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          // Subscribe to private incoming queue
          client.subscribe('/user/queue/messages', handleIncomingChatMessage);
          // Subscribe to public user topics for reliable cross-browser delivery
          if (user?.publicId) {
            client.subscribe(`/topic/users/${user.publicId}/messages`, handleIncomingChatMessage);
          }
          if (user?.username) {
            client.subscribe(`/topic/users/${user.username}/messages`, handleIncomingChatMessage);
          }
        },
        onStompError: (frame) => {
          console.warn('STOMP broker error:', frame.headers?.['message']);
        },
      });

      client.activate();
      stompClientRef.current = client;
    } catch {
      // WebSocket initialization error
    }

    fetchConversations();

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [isAuthenticated, token, user, fetchConversations]);

  // Subscribe to the active conversation's public broadcast topic
  useEffect(() => {
    if (!stompClientRef.current || !stompClientRef.current.connected || !activeConversation?.publicId) return;
    let subscription = null;
    try {
      subscription = stompClientRef.current.subscribe(
        `/topic/conversations/${activeConversation.publicId}`,
        (msg) => {
          try {
            const chatMsg = JSON.parse(msg.body);
            setMessages((prev) => addOrUpdateMessage(prev, chatMsg));
          } catch (e) {}
        }
      );
    } catch (e) {}

    return () => {
      try {
        if (subscription) subscription.unsubscribe();
      } catch (e) {}
    };
  }, [activeConversation?.publicId]);

  // 3.5-second background polling fallback to guarantee real-time updates even without manual clicks or page reloads
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(async () => {
      fetchConversations();
      if (activeConversation?.publicId) {
        try {
          const res = await chatApi.getMessages(activeConversation.publicId, 0, 50);
          const list = res?.data?.content || (Array.isArray(res?.data) ? res.data : []);
          if (list.length > 0) {
            setMessages((prev) => {
              if (prev.length !== list.length || (list[list.length - 1]?.publicId !== prev[prev.length - 1]?.publicId)) {
                return list;
              }
              return prev;
            });
          }
        } catch {}
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isAuthenticated, activeConversation?.publicId, fetchConversations]);

  const sendMessage = async (content, reply = null) => {
    if (!activeConversation || !content.trim()) return;
    if (activeConversation.isClosed) {
      console.warn('Consultation concluded. Message sending disabled.');
      return;
    }

    const trimmed = content.trim();
    const localPublicId = `msg-local-${Date.now()}`;
    const newMsg = {
      publicId: localPublicId,
      conversationPublicId: activeConversation.publicId,
      senderUserPublicId: user?.publicId || 'user-me',
      senderUsername: user?.username || 'me',
      recipientUserPublicId: activeConversation.targetUser?.publicId,
      recipientUsername: activeConversation.targetUser?.username,
      content: trimmed,
      replyToMessagePublicId: reply?.publicId || reply?.replyToMessagePublicId || null,
      replyToSenderName: reply?.senderName || reply?.replyToSenderName || null,
      replyToContent: reply?.content || reply?.replyToContent || null,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [...prev, newMsg]);

    try {
      // Call backend REST endpoint (persists to DB and triggers STOMP broadcast automatically)
      const res = await chatApi.sendMessage(activeConversation.publicId, trimmed, reply);
      if (res?.data) {
        // Replace local optimistic message with persisted entity cleanly
        setMessages((prev) => addOrUpdateMessage(prev.filter(m => m.publicId !== localPublicId), res.data));
      }
      fetchConversations();
    } catch (err) {
      console.warn('Chat send rejected by backend:', err);
      // Remove optimistic message because backend rejected it (e.g. consultation concluded)
      setMessages((prev) => prev.filter(m => m.publicId !== localPublicId));
      if (err.response?.data?.message?.includes('concluded') || err.response?.data?.code === 'CONSULTATION_CONCLUDED') {
        setActiveConversation((prev) => prev ? { ...prev, isClosed: true } : prev);
      }
    }
  };

  const deleteMessage = async (messagePublicId, deleteType = 'SELF') => {
    try {
      const res = await chatApi.deleteMessage(messagePublicId, deleteType);
      if (deleteType === 'SELF') {
        setMessages((prev) => prev.filter((m) => m.publicId !== messagePublicId));
      } else if (res?.data) {
        setMessages((prev) => addOrUpdateMessage(prev, res.data));
      }
      return res;
    } catch (err) {
      console.warn('Delete message error:', err);
      throw err;
    }
  };

  const sendAttachment = async (file, caption = '') => {
    if (!activeConversation || !file) return;
    if (activeConversation.isClosed) {
      console.warn('Consultation concluded. File attachment disabled.');
      return;
    }
    try {
      const res = await chatApi.uploadAttachment(activeConversation.publicId, file, caption);
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        fetchConversations();
        return res.data;
      }
    } catch (err) {
      console.warn('Backend upload not available, showing preview:', err);
      const localMsg = {
        publicId: `msg-doc-${Date.now()}`,
        senderUserPublicId: user?.publicId || 'client',
        senderUsername: user?.username || 'me',
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

  const openChatWithUser = async (recipient, recipientName, appointmentPublicId = null) => {
    const recipientPublicId = typeof recipient === 'object'
      ? (recipient.publicId || recipient.userPublicId || recipient.id)
      : recipient;
    const effectiveName = typeof recipient === 'object'
      ? (recipient.fullName || recipient.name || recipient.username)
      : recipientName;
    const effectiveUsername = typeof recipient === 'object' ? recipient.username : null;
    const effectiveRole = typeof recipient === 'object'
      ? (recipient.role || (recipient.barCouncilNumber ? 'LAWYER' : 'CLIENT'))
      : null;
    const effectiveImage = typeof recipient === 'object' ? recipient.profileImageUrl : null;

    try {
      const res = await chatApi.getOrCreateConversation(recipientPublicId, effectiveUsername, appointmentPublicId);
      if (res?.data) {
        const conv = normalizeConversation(res.data);
        if (effectiveName && (!conv.targetUser?.fullName || conv.targetUser.fullName === 'Legal Contact')) {
          conv.targetUser.fullName = effectiveName;
        }
        if (effectiveRole) conv.targetUser.role = effectiveRole;
        if (effectiveImage) conv.targetUser.profileImageUrl = effectiveImage;

        setActiveConversation(conv);
        setIsDrawerOpen(true);
        await loadConversationMessages(conv.publicId);
        fetchConversations();
        return;
      }
    } catch {
      // Fallback
    }

    const resolved = resolveUserIdentity(null, recipientPublicId);
    const targetConv =
      conversations.find((c) => c.targetUser?.publicId === recipientPublicId) || {
        publicId: `conv-${recipientPublicId}`,
        targetUser: {
          publicId: recipientPublicId,
          fullName: effectiveName || resolved.fullName,
          role: effectiveRole || resolved.role,
          profileImageUrl: effectiveImage || resolved.profileImageUrl,
        },
        lastMessage: '',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
      };

    setActiveConversation(targetConv);
    setIsDrawerOpen(true);
    setMessages([]);
  };

  const unlockConversation = (conversationPublicId, consultationMode = 'ONLINE', amount = 1500) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.publicId === conversationPublicId) {
          return {
            ...c,
            isLocked: false,
            consultationMode,
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
        consultationMode,
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
      senderUserPublicId: 'system',
      senderUsername: 'LawinoMeet Escrow',
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

  const closeConversation = async (conversationPublicId) => {
    try {
      await chatApi.closeConversation(conversationPublicId);
    } catch (err) {
      console.warn('Backend close conversation call error or offline:', err);
    }
    setConversations((prev) =>
      prev.map((c) => (c.publicId === conversationPublicId ? { ...c, isClosed: true } : c))
    );
    setActiveConversation((prev) => {
      if (!prev || prev.publicId !== conversationPublicId) return prev;
      return { ...prev, isClosed: true };
    });
    const closeNotice = {
      publicId: `msg-sys-${Date.now()}`,
      senderUserPublicId: 'system',
      senderUsername: 'LawinoMeet Legal Registry',
      content:
        '⚖️ Consultation Concluded: Presiding counsel marked this legal advisory session completed. This chat room is now closed and preserved under Section 126 statutory privilege.',
      createdAt: new Date().toISOString(),
      isSystemNotice: true,
    };
    setMessages((prev) => [...prev, closeNotice]);
  };

  const selectConversation = (conv) => {
    const normalized = normalizeConversation(conv);
    setActiveConversation(normalized);
    setMobileThreadOpen(true);
    loadConversationMessages(normalized.publicId);
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
        deleteMessage,
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
