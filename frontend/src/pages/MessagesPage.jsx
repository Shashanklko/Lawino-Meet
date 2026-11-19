import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Video,
  Send,
  Paperclip,
  CheckCheck,
  ShieldCheck,
  Lock,
  ArrowLeft,
  Calendar,
  Building,
  Clock,
  Phone,
  User,
  ExternalLink,
  ChevronRight,
  Info,
  X,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { appointmentApi } from '../api/appointmentApi';

export const MessagesPage = () => {
  const { user } = useAuth();
  const { theme, currentTheme } = useTheme();
  const {
    conversations,
    activeConversation,
    messages,
    sendMessage,
    sendAttachment,
    selectConversation,
    unlockConversation,
    closeConversation,
    mobileThreadOpen,
    setMobileThreadOpen,
  } = useChat();

  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [showCaseInfo, setShowCaseInfo] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [selectedServiceMode, setSelectedServiceMode] = useState('ONLINE');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingFile(true);
      await sendAttachment(file);
    } catch (err) {
      console.error('Failed to upload file attachment:', err);
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const serviceOptions = [
    {
      id: 'ONLINE',
      title: 'Online-Video Conferencing',
      tag: 'Recommended',
      price: 1500,
      duration: '30 mins WebRTC room',
      icon: Video,
      description: 'Encrypted WebRTC Chamber + In-consultation chat, screen sharing, and audio/video.',
    },
    {
      id: 'CHAMBER',
      title: 'In-Office (Physical)',
      tag: 'Chamber Visit',
      price: 2000,
      duration: '45 mins meeting',
      icon: Building,
      description: 'Physical in-person consultation at High Court chamber + continuous document briefing chat.',
    },
    {
      id: 'CHAT',
      title: 'Online Chat Service',
      tag: 'Quick Advisory',
      price: 800,
      duration: '24-hour advisory',
      icon: MessageSquare,
      description: 'Direct 1-on-1 legal chat advisory with document review & privileged legal opinion.',
    },
  ];

  const handleAvailService = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      const selectedOption = serviceOptions.find((s) => s.id === selectedServiceMode);
      if (activeConversation && unlockConversation) {
        unlockConversation(
          activeConversation.publicId,
          selectedServiceMode,
          selectedOption ? selectedOption.price : 1500
        );
      }
      setIsProcessingPayment(false);
      setUnlockModalOpen(false);
      setPaymentSuccessToast(
        `Service activated! Escrow retainer of ₹${selectedOption?.price.toLocaleString(
          'en-IN'
        )} held securely. Chat is now unlocked.`
      );
      setTimeout(() => setPaymentSuccessToast(''), 4500);
    }, 800);
  };

  const isLawyer = user?.role === 'LAWYER';
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchApts = async () => {
      try {
        const res = isLawyer
          ? await appointmentApi.getLawyerAppointments()
          : await appointmentApi.getMyAppointments();
        const list = res?.data?.content || (Array.isArray(res?.data) ? res.data : []);
        if (active) setAppointments(list);
      } catch (err) {
        if (active) setAppointments([]);
      }
    };
    fetchApts();
    const interval = setInterval(fetchApts, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isLawyer]);

  const targetId = activeConversation?.targetUser?.publicId;
  const targetUsername = activeConversation?.targetUser?.username;
  const relatedAppointment = appointments.find((a) => {
    const aptOtherId = isLawyer ? (a.clientUserPublicId || a.client?.publicId) : (a.lawyerUserPublicId || a.lawyer?.publicId);
    const aptOtherUser = isLawyer ? (a.clientUsername || a.client?.username) : (a.lawyerUsername || a.lawyer?.username);
    return (targetId && aptOtherId === targetId) || (targetUsername && aptOtherUser === targetUsername);
  });

  const resolveConvTarget = (conv) => {
    if (!conv) {
      return {
        name: isLawyer ? 'Rohit Verma' : 'Adv. Raghavan Nambiar',
        role: isLawyer ? 'CLIENT' : 'LAWYER',
        roleLabel: isLawyer ? 'Client' : 'Advocate',
        img: null,
      };
    }
    let name = conv.targetUser?.fullName;
    let role = conv.targetUser?.role || (isLawyer ? 'CLIENT' : 'LAWYER');
    let img = conv.targetUser?.profileImageUrl;

    const cId = conv.targetUser?.publicId || conv.otherParticipantPublicId;
    const cUser = conv.targetUser?.username || conv.otherParticipantUsername;
    const matchApt = appointments.find((a) => {
      const aptOtherId = isLawyer ? (a.clientUserPublicId || a.client?.publicId) : (a.lawyerUserPublicId || a.lawyer?.publicId);
      const aptOtherUser = isLawyer ? (a.clientUsername || a.client?.username) : (a.lawyerUsername || a.lawyer?.username);
      return (cId && aptOtherId === cId) || (cUser && aptOtherUser === cUser);
    });

    if (matchApt) {
      if (isLawyer) {
        name = matchApt.client?.fullName || matchApt.clientFullName || (name && name !== 'Contact' && name !== 'Legal Contact' ? name : 'Rohit Verma');
        role = 'CLIENT';
      } else {
        name = matchApt.lawyer?.fullName || matchApt.lawyerFullName || (name && name !== 'Contact' && name !== 'Legal Contact' ? name : 'Adv. Raghavan Nambiar');
        role = 'LAWYER';
      }
    } else if (!name || name === 'Contact' || name === 'Legal Contact' || name === 'Advocate') {
      name = isLawyer ? 'Rohit Verma' : 'Adv. Raghavan Nambiar';
      role = isLawyer ? 'CLIENT' : 'LAWYER';
    }

    const roleLabel = role === 'LAWYER' ? 'Advocate' : 'Client';
    return { name, role, roleLabel, img };
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const filteredConversations = conversations.filter((c) => {
    const target = resolveConvTarget(c);
    return target.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const isChatLocked = activeConversation?.isLocked;

  const handleLaunchMeeting = () => {
    if (relatedAppointment?.meetingRoomPublicId) {
      navigate(`/meeting/${relatedAppointment.meetingRoomPublicId}`);
      return;
    }
    if (relatedAppointment?.publicId) {
      navigate(`/meeting/${relatedAppointment.publicId}`);
      return;
    }
    if (appointments[0]?.meetingRoomPublicId) {
      navigate(`/meeting/${appointments[0].meetingRoomPublicId}`);
      return;
    }
    if (appointments[0]?.publicId) {
      navigate(`/meeting/${appointments[0].publicId}`);
      return;
    }
    const roomId = activeConversation?.publicId || 'chamber_consultation';
    navigate(`/meeting/${roomId}`);
  };

  return (
    <div className="h-full flex-1 flex flex-col bg-white sm:bg-white/80 sm:backdrop-blur-xl sm:border sm:border-stone-200/80 sm:rounded-2xl sm:shadow-xs overflow-hidden select-none">
      <div className="flex-1 flex overflow-hidden">
        {/* =========================================================================
            LEFT COLUMN: Conversations & Client Inquiries List
            ========================================================================= */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-stone-200/80 flex flex-col bg-[var(--bg-cream-soft)]/70 shrink-0 ${
            mobileThreadOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Top Search & Filter Bar */}
          <div className="p-3.5 border-b border-stone-200/80 space-y-2.5 bg-white/70">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-serif font-bold text-[#1F1C1B] flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-[var(--bg-primary)]" />
                <span>{isLawyer ? 'Client Inquiries & Chats' : 'My Legal Chats'}</span>
              </h2>
              <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full font-medium">
                {conversations.length} active
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isLawyer ? 'Search client name or case...' : 'Search lawyer or topic...'}
                className="w-full text-xs bg-white border border-stone-200 rounded-xl pl-8 pr-3 py-2 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[var(--bg-primary)] transition"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {filteredConversations.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400 p-4 space-y-1">
                <p>No conversations found</p>
                <p className="text-[10px]">Chats start after booking an appointment or advice service.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConversation?.publicId === conv.publicId;
                const targetInfo = resolveConvTarget(conv);
                const targetName = targetInfo.name;
                const roleLabel = targetInfo.roleLabel;
                const profileImg = targetInfo.img || conv.targetUser?.profileImageUrl;
                const locked = conv.isLocked;

                return (
                  <div
                    key={conv.publicId}
                    onClick={() => {
                      selectConversation(conv);
                      setMobileThreadOpen(true);
                    }}
                    className={`p-3.5 px-4 transition cursor-pointer flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-white border-l-4 border-l-[var(--bg-primary)] shadow-xs'
                        : 'hover:bg-white/80'
                    }`}
                  >
                    <div className="relative shrink-0 mt-0.5">
                      {profileImg ? (
                        <img
                          src={profileImg}
                          alt={targetName}
                          className="w-10 h-10 rounded-full object-cover shadow-xs border border-stone-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] text-white flex items-center justify-center font-serif font-bold text-sm shadow-xs">
                          {targetName[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      {!locked ? (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      ) : (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-amber-500 text-white flex items-center justify-center ring-2 ring-white text-[8px]">
                          🔒
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-serif font-bold text-[#1F1C1B] truncate">
                          {targetName}
                        </h4>
                        <span className="text-[10px] text-stone-400 font-mono shrink-0 ml-1">
                          {conv.lastMessageAt
                            ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Active'}
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-500 truncate mt-0.5 font-sans leading-tight">
                        {locked ? '🔒 Consultation required to unlock chat' : conv.lastMessage}
                      </p>

                      <div className="flex items-center space-x-2 mt-1.5">
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.2 rounded-full bg-stone-200/60 text-stone-700">
                          {roleLabel}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="text-[10px] bg-[var(--bg-primary)] text-white font-bold px-1.5 py-0.2 rounded-full">
                            {conv.unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Active Conversation & Messaging Pane
            ========================================================================= */}
        <div
          className={`flex-1 flex flex-col bg-white overflow-hidden ${
            !mobileThreadOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Thread Header Bar */}
              <div className="p-2.5 sm:p-3.5 px-3 sm:px-6 border-b border-stone-200/80 bg-[var(--bg-cream-soft)]/90 flex items-center justify-between shrink-0 gap-2 overflow-hidden">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setMobileThreadOpen(false)}
                    className="md:hidden p-1.5 -ml-1 rounded-lg text-stone-600 hover:bg-stone-200/60 shrink-0 cursor-pointer"
                    title="Back to conversations"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative shrink-0">
                    {(() => {
                      const activeInfo = resolveConvTarget(activeConversation);
                      const img = activeInfo.img || activeConversation.targetUser?.profileImageUrl;
                      return img ? (
                        <img
                          src={img}
                          alt={activeInfo.name}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-xs border border-stone-200"
                        />
                      ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--bg-primary)] text-white flex items-center justify-center font-serif font-bold text-xs sm:text-sm shadow-xs">
                          {activeInfo.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      );
                    })()}
                    {!isChatLocked && (
                      <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {(() => {
                      const activeInfo = resolveConvTarget(activeConversation);
                      return (
                        <>
                          <div className="flex items-center space-x-1.5">
                            <h3 className="text-xs sm:text-sm font-serif font-bold text-[#1F1C1B] truncate max-w-[140px] sm:max-w-none">
                              {activeInfo.name}
                            </h3>
                            {!isChatLocked && (
                              <span className="hidden md:inline text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full font-medium shrink-0">
                                Active Matter
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-stone-500 font-sans flex items-center space-x-1 truncate">
                            <span className="font-semibold text-stone-700">
                              {activeInfo.roleLabel}
                            </span>
                            {activeConversation.targetUser?.firmName && (
                              <>
                                <span>•</span>
                                <span className="truncate">{activeConversation.targetUser.firmName}</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="text-emerald-700 font-medium">Encrypted</span>
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
                  {!isChatLocked && (
                    <>
                      {activeConversation.isClosed ? (
                        <span className="px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[10px] sm:text-[11px] font-medium flex items-center space-x-1 select-none shrink-0 whitespace-nowrap">
                          <Lock className="w-3 h-3 text-amber-700 shrink-0" />
                          <span className="hidden md:inline">Chat Room Closed</span>
                          <span className="md:hidden text-[10px]">Closed</span>
                        </span>
                      ) : isLawyer ? (
                        <button
                          type="button"
                          onClick={() => closeConversation(activeConversation.publicId)}
                          className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-[11px] sm:text-xs font-semibold flex items-center space-x-1 transition cursor-pointer shrink-0 shadow-2xs whitespace-nowrap"
                          title="Conclude legal advice and close this chat room"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                          <span className="hidden md:inline">Mark Complete &amp; Close Room</span>
                          <span className="md:hidden text-[10px]">Complete</span>
                        </button>
                      ) : null}

                      {!activeConversation.isClosed && (
                        <>
                          {relatedAppointment?.status === 'AWAITING_PAYMENT' ? (
                            !isLawyer ? (
                              <Link
                                to="/client/appointments"
                                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] sm:text-xs font-semibold tracking-wider transition shadow-xs flex items-center space-x-1 cursor-pointer shrink-0 whitespace-nowrap"
                                title="Advocate has accepted. Complete payment to activate consultation chamber."
                              >
                                <CreditCard className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                                <span>Pay Retainer &amp; Unlock</span>
                              </Link>
                            ) : (
                              <span
                                className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[10px] sm:text-[11px] font-medium flex items-center space-x-1 select-none shrink-0 whitespace-nowrap"
                                title="Waiting for client to complete retainer payment before room unlocks."
                              >
                                <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                                <span>Awaiting Client Payment</span>
                              </span>
                            )
                          ) : relatedAppointment?.status === 'COMPLETED' ? (
                            <span
                              className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] sm:text-[11px] font-medium flex items-center space-x-1 select-none shrink-0 whitespace-nowrap"
                              title="Consultation session successfully completed."
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Session Concluded</span>
                            </span>
                          ) : (relatedAppointment && (relatedAppointment.status === 'CONFIRMED' || relatedAppointment.appointmentStatus === 'CONFIRMED') && relatedAppointment.isOnline && !relatedAppointment.isChatOnly && !relatedAppointment.isInPerson) ? (
                            <button
                              type="button"
                              onClick={handleLaunchMeeting}
                              className="px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white text-[11px] sm:text-xs font-semibold tracking-wider transition shadow-xs flex items-center space-x-1 cursor-pointer shrink-0 whitespace-nowrap"
                            >
                              <Video className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                              <span className="hidden sm:inline">Join Room</span>
                            </button>
                          ) : (relatedAppointment && (relatedAppointment.status === 'CONFIRMED' || relatedAppointment.appointmentStatus === 'CONFIRMED') && relatedAppointment.isInPerson) ? (
                            <span
                              className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[10px] sm:text-[11px] font-medium flex items-center space-x-1 select-none shrink-0 whitespace-nowrap"
                              title={relatedAppointment.chamberAddress || 'In-Chamber Office Consultation'}
                            >
                              <Building className="w-3 h-3 text-amber-700 shrink-0" />
                              <span>In-Chamber Active</span>
                            </span>
                          ) : (relatedAppointment && (relatedAppointment.status === 'CONFIRMED' || relatedAppointment.appointmentStatus === 'CONFIRMED') && relatedAppointment.isChatOnly) ? (
                            <span
                              className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-[10px] sm:text-[11px] font-medium flex items-center space-x-1 select-none shrink-0 whitespace-nowrap"
                            >
                              <MessageSquare className="w-3 h-3 text-purple-700 shrink-0" />
                              <span>Chat Advisory Active</span>
                            </span>
                          ) : null}
                        </>
                      )}
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowCaseInfo(!showCaseInfo)}
                    className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 transition cursor-pointer shrink-0"
                    title="Case Details"
                  >
                    <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              {/* Collapsible Case Info Pill */}
              {showCaseInfo && (
                <div className="p-4 bg-stone-50 border-b border-stone-200 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Consultation Format</span>
                    <span className="font-semibold text-stone-800">
                      {activeConversation.consultationMode === 'CHAT'
                        ? 'Legal Chat Advisory (Text Only)'
                        : activeConversation.consultationMode === 'CHAMBER'
                        ? 'High Court Chamber (In-Office Physical)'
                        : '1-on-1 Online Video Call (WebRTC)'}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Case Topic</span>
                    <span className="font-semibold text-stone-800">
                      {activeConversation.matterTitle || 'Anticipatory Bail & Legal Advisory'}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Privacy Standard</span>
                    <span className="text-emerald-700 font-semibold">100% Confidential Client Privilege</span>
                  </div>
                  {relatedAppointment?.isInPerson && (
                    <div className="sm:col-span-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-stone-800 space-y-1.5 mt-1">
                      {relatedAppointment.status === 'CONFIRMED' ||
                      relatedAppointment.status === 'IN_PROGRESS' ||
                      relatedAppointment.status === 'COMPLETION_REQUESTED' ||
                      relatedAppointment.status === 'COMPLETED' ? (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5 font-bold text-amber-900 text-xs">
                              <Building className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>Confirmed In-Chamber Office Address:</span>
                            </div>
                            <span className="text-[9px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded font-bold">
                              ✓ Retainer Verified
                            </span>
                          </div>
                          <p className="font-semibold text-xs text-stone-900">
                            {relatedAppointment.chamberAddress || 'Advocate Chambers, High Court Complex, New Delhi - 110001'}
                          </p>
                          {relatedAppointment.directionsInstructions && (
                            <p className="text-[10px] text-stone-600 italic">
                              Directions: {relatedAppointment.directionsInstructions}
                            </p>
                          )}
                          <div>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                relatedAppointment.chamberAddress || 'Advocate Chambers, High Court Complex, New Delhi'
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-[10px] font-semibold text-[#831826] hover:underline"
                            >
                              <span>Navigate via Google Maps &rarr;</span>
                            </a>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5 font-bold text-stone-800 text-xs">
                              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Chamber Office Address Concealed</span>
                            </div>
                            <span className="text-[9px] font-mono text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded font-bold">
                              LOCKED
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 leading-tight">
                            Chamber office room number, building security gate instructions, and Google Maps pin will unlock immediately upon retainer payment verification.
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Chat Messages or Locked Notice */}
              {isChatLocked ? (
                /* =========================================================================
                    LOCKED STATE (If no consultation or chat service booked yet)
                    ========================================================================= */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-cream-soft)]/40 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="max-w-md space-y-1.5">
                    <h3 className="text-base font-serif font-bold text-[#1F1C1B]">
                      Chat is locked for this advocate
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed font-sans">
                      As per the Advocates Act and platform guidelines, direct messaging is enabled once you book an online consultation, office visit, or quick chat advisory service.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setUnlockModalOpen(true)}
                      className="px-5 py-2.5 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white text-xs font-serif font-bold uppercase tracking-wider shadow-sm transition cursor-pointer"
                    >
                      Book Consultation to Unlock Chat
                    </button>
                  </div>
                </div>
              ) : (
                /* =========================================================================
                    UNLOCKED STATE: Active Messages Scroll Area
                    ========================================================================= */
                <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 bg-gradient-to-b from-white/70 to-[var(--bg-cream-soft)]/50">
                  {/* Privilege Notice Banner */}
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-stone-100/80 border border-stone-200/80 text-center max-w-md mx-auto text-[10px] sm:text-[11px] text-stone-600 space-y-0.5 sm:space-y-1">
                    <p className="font-semibold text-stone-900 flex items-center justify-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>End-to-End Private Legal Thread</span>
                    </p>
                    <p className="text-[10px] text-stone-400">
                      Messages exchanged here are protected and privileged between client and counsel.
                    </p>
                  </div>

                  {messages.map((m) => {
                    const isMe =
                      m.senderPublicId === user?.publicId ||
                      m.senderUserPublicId === user?.publicId ||
                      m.senderUsername === user?.username ||
                      (user?.fullName && m.senderName === user.fullName);
                    const senderDisplayName = isMe
                      ? (user?.fullName || 'You')
                      : (activeConversation?.targetUser?.fullName || m.senderName || m.senderUsername || 'Counsel');

                    return (
                      <div
                        key={m.publicId || m.id || Math.random()}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs shadow-xs ${
                            isMe
                              ? 'bg-[var(--bg-primary)] text-white rounded-br-xs'
                              : 'bg-white border border-stone-200 text-stone-800 rounded-bl-xs'
                          }`}
                        >
                          {/* Attachment Link / Card if present */}
                          {m.attachmentUrl && (
                            <a
                              href={m.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center space-x-2 p-2 rounded-xl mb-1.5 transition ${
                                isMe
                                  ? 'bg-white/15 hover:bg-white/25 text-white'
                                  : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                              }`}
                            >
                              <Paperclip className="w-3.5 h-3.5 shrink-0" />
                              <div className="overflow-hidden text-left flex-1 min-w-0">
                                <p className="font-semibold truncate text-[11px]">
                                  {m.attachmentName || 'Case Document'}
                                </p>
                                {m.attachmentSize && (
                                  <p className="text-[9px] opacity-75 font-mono">
                                    {(m.attachmentSize / 1024).toFixed(1)} KB
                                  </p>
                                )}
                              </div>
                              <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                            </a>
                          )}

                          {m.content && (
                            <p className="leading-relaxed whitespace-pre-wrap font-sans">{m.content}</p>
                          )}
                          {!m.content && m.text && (
                            <p className="leading-relaxed whitespace-pre-wrap font-sans">{m.text}</p>
                          )}
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-stone-400 mt-1 px-1 font-mono">
                          {m.createdAt
                            ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : m.time || 'Just now'}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Message Input Bar (Only if Unlocked) */}
              {!isChatLocked && (
                <div className="p-2 sm:p-3 px-3 sm:px-6 bg-white border-t border-stone-200/80 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  {/* Quick Legal Message Chips */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1.5 text-[10px] sm:text-[11px] text-stone-600 no-scrollbar">
                    <span className="text-[10px] text-stone-400 font-bold uppercase shrink-0">Quick reply:</span>
                    <button
                      type="button"
                      onClick={() => setInputText('I have uploaded the relevant case notice.')}
                      className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-stone-100 hover:bg-stone-200 transition shrink-0 cursor-pointer"
                    >
                      📄 Document uploaded
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputText('Ready to connect on video call.')}
                      className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-stone-100 hover:bg-stone-200 transition shrink-0 cursor-pointer"
                    >
                      📹 Ready on video
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputText('Will be visiting the chamber as scheduled.')}
                      className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-stone-100 hover:bg-stone-200 transition shrink-0 cursor-pointer"
                    >
                      🏛️ Visiting chamber
                    </button>
                  </div>

                  <form onSubmit={handleSendMessage} className="flex items-center space-x-1.5 sm:space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingFile}
                      className="p-2 sm:p-2.5 rounded-xl border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer shrink-0 disabled:opacity-40"
                      title="Attach document or notice (PDF, JPG, PNG)"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={isUploadingFile ? 'Uploading document...' : 'Type message or legal query...'}
                      disabled={isUploadingFile}
                      className="flex-1 bg-[var(--bg-cream-soft)] border border-stone-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[var(--bg-primary)] focus:bg-white transition min-w-0"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isUploadingFile}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 disabled:opacity-40 text-white text-xs font-serif font-bold uppercase tracking-wider transition shadow-xs flex items-center space-x-1 cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400 space-y-2">
              <MessageSquare className="w-12 h-12 text-stone-300" />
              <h3 className="text-base font-serif font-bold text-[#1F1C1B]">Select a conversation</h3>
              <p className="text-xs max-w-sm">
                Choose a client or advocate from the left panel to review messages and case communications.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PAYMENT SUCCESS TOAST */}
      {paymentSuccessToast && (
        <div className="fixed top-5 right-5 z-[9999] max-w-md p-4 rounded-2xl bg-[#1C1817]/95 backdrop-blur-xl border border-emerald-500/50 text-white shadow-2xl flex items-center justify-between space-x-3 animate-in slide-in-from-top-3">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium leading-relaxed">{paymentSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setPaymentSuccessToast('')}
            className="text-stone-400 hover:text-white text-xs font-bold shrink-0 ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3-OPTION SERVICE SELECTION & ESCROW CHECKOUT MODAL */}
      {unlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                    Statutory Service Retainer
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-stone-900 mt-1">
                  Select Legal Service to Unlock Chat
                </h3>
                <p className="text-xs text-stone-500 font-sans mt-0.5">
                  Choose a consultation format with{' '}
                  <strong className="text-stone-700">
                    {activeConversation?.targetUser?.fullName || 'the Advocate'}
                  </strong>
                  . Retainer remains protected in escrow until session completion.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUnlockModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Options List */}
            <div className="space-y-3">
              {serviceOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedServiceMode === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedServiceMode(opt.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-[var(--bg-primary)] bg-[var(--bg-primary)]/5 ring-1 ring-[var(--bg-primary)]'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[var(--bg-primary)] text-white shadow-xs'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-serif font-bold text-stone-900 text-xs sm:text-sm">
                            {opt.title}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                              isSelected
                                ? 'bg-[var(--bg-primary)] text-white'
                                : 'bg-stone-200/80 text-stone-700'
                            }`}
                          >
                            {opt.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-tight">
                          {opt.description}
                        </p>
                        <div className="flex items-center space-x-3 text-[10px] text-stone-500 font-mono pt-0.5">
                          <span>⏱ {opt.duration}</span>
                          <span>•</span>
                          <span>🔒 Privileged</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-serif font-bold text-base text-stone-900">
                        ₹{opt.price.toLocaleString('en-IN')}
                      </p>
                      <span className="text-[9px] font-mono text-stone-400">Escrow Retainer</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Escrow Guarantee Pill */}
            <div className="p-3 rounded-xl bg-stone-100/80 border border-stone-200/70 flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-2 text-stone-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Retainer held in Bar Council compliant escrow until session conclusion.</span>
              </div>
              <span className="font-mono text-stone-500 text-[10px] font-bold">100% Protected</span>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setUnlockModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 font-medium text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handleAvailService}
                className="px-5 py-2.5 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white font-serif font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <span>Securing Escrow Retainer...</span>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>
                      Pay Retainer &amp; Unlock Chat (₹
                      {
                        serviceOptions
                          .find((s) => s.id === selectedServiceMode)
                          ?.price.toLocaleString('en-IN')
                      }
                      )
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
