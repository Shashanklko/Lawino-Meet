import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  MonitorUp,
  MonitorOff,
  MessageSquare,
  ShieldCheck,
  Lock,
  Clock,
  ArrowLeft,
  X,
  Send,
  Users,
  Copy,
  Check,
  Download,
  Circle,
  Pause,
  Play,
  Maximize2,
  Sparkles,
  UserPlus,
  AlertCircle,
  HardDrive,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMultiPartyMeeting } from '../hooks/useMultiPartyMeeting';
import { useLocalMeetingRecorder } from '../hooks/useLocalMeetingRecorder';

export const VideoMeetingPage = () => {
  const { roomPublicId } = useParams();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  // Guest lobby state (for participants joining via share link without full login)
  const [guestName, setGuestName] = useState(() => {
    return localStorage.getItem('lawino_guest_name') || '';
  });
  const [guestRole, setGuestRole] = useState('CLIENT');
  const [hasEnteredRoom, setHasEnteredRoom] = useState(() => {
    return !!authUser; // Logged-in users proceed past pre-join; guests fill name first
  });

  // Effective participant profile
  const effectiveUser = authUser
    ? {
        publicId: authUser.publicId || authUser.id || 'auth_user',
        fullName: authUser.fullName || authUser.username || 'Counsel / Client',
        username: authUser.username,
        role: authUser.role || 'CLIENT',
      }
    : {
        publicId: `guest_${roomPublicId?.slice(0, 4)}_${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: guestName || 'Invited Participant',
        username: guestName || 'Guest',
        role: guestRole,
      };

  const isAdvocateHost = authUser?.role === 'LAWYER' || effectiveUser.role === 'LAWYER' || effectiveUser.role === 'FIRM_ADMIN';

  // Admission & Waiting Room State:
  // Presiding lawyer enters immediately; any second participant (client or guest via link) must be admitted by lawyer
  const [isAdmitted, setIsAdmitted] = useState(() => {
    if (isAdvocateHost) return true;
    try {
      return sessionStorage.getItem('lawino_admitted_' + roomPublicId) === 'true';
    } catch {
      return false;
    }
  });
  const [admissionStatus, setAdmissionStatus] = useState(() => (isAdmitted ? 'ADMITTED' : 'WAITING')); // 'WAITING' | 'ADMITTED' | 'DECLINED'
  const [pendingKnocks, setPendingKnocks] = useState([]);
  const [lobbyStream, setLobbyStream] = useState(null);
  const [lobbyMuted, setLobbyMuted] = useState(false);
  const [lobbyVideoOff, setLobbyVideoOff] = useState(false);
  const lobbyVideoRef = useRef(null);

  // Multi-party WebRTC Hook - Active only after successful room entry AND admission approval
  const {
    localStream,
    participants,
    isConnected,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    error: rtcError,
    isRoomDestroyed,
    destroyReason,
    chatMessages,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    sendInCallMessage,
    addSimulatedParticipant,
    removeSimulatedParticipant,
    destroyRoom,
    endCall,
  } = useMultiPartyMeeting((hasEnteredRoom && isAdmitted) ? roomPublicId : null, effectiveUser);

  // Local Device-Only In-Browser Recording Hook
  const {
    isRecording,
    isPaused,
    recordingDuration,
    formatTime,
    savedFileInfo,
    clearSavedNotification,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  } = useLocalMeetingRecorder({
    roomPublicId,
    localStream,
    participants,
  });

  // UI state
  const [callDuration, setCallDuration] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isConfirmEndOpen, setIsConfirmEndOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [pinnedParticipantId, setPinnedParticipantId] = useState(null);

  // Video refs
  const localVideoRef = useRef(null);

  // Bind local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Camera preview in Waiting Room (for clients awaiting lawyer admission)
  useEffect(() => {
    if (hasEnteredRoom && !isAdmitted && !lobbyStream) {
      let active = true;
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          setLobbyStream(stream);
          if (lobbyVideoRef.current) {
            lobbyVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => {});

      return () => {
        active = false;
      };
    }

    if (isAdmitted && lobbyStream) {
      lobbyStream.getTracks().forEach((t) => t.stop());
      setLobbyStream(null);
    }
  }, [hasEnteredRoom, isAdmitted, lobbyStream]);

  // Client Waiting Lobby: Repeatedly broadcast knock request and listen for Advocate Host approval
  useEffect(() => {
    if (isAdvocateHost || isAdmitted || !hasEnteredRoom) return;

    const bc = new BroadcastChannel('lawino_knocks_' + roomPublicId);

    const knockPayload = {
      id: effectiveUser.publicId,
      name: effectiveUser.fullName,
      role: effectiveUser.role,
      roomPublicId,
      timestamp: Date.now(),
    };

    const emitKnock = () => {
      bc.postMessage({ type: 'KNOCK_REQUEST', ...knockPayload });
      try {
        localStorage.setItem(`lawino_knock_${roomPublicId}`, JSON.stringify(knockPayload));
      } catch {}
    };

    emitKnock();
    const knockTimer = setInterval(emitKnock, 2000);

    const handleMessage = (e) => {
      const data = e.data || {};
      if (data.type === 'KNOCK_ADMIT' && (data.targetId === effectiveUser.publicId || !data.targetId)) {
        if (data.approved) {
          try {
            sessionStorage.setItem('lawino_admitted_' + roomPublicId, 'true');
          } catch {}
          setIsAdmitted(true);
          setAdmissionStatus('ADMITTED');
        } else {
          setAdmissionStatus('DECLINED');
        }
      }
    };

    bc.addEventListener('message', handleMessage);

    const handleStorage = (e) => {
      if (e.key === `lawino_admit_${roomPublicId}_${effectiveUser.publicId}`) {
        if (e.newValue === 'APPROVED') {
          try {
            sessionStorage.setItem('lawino_admitted_' + roomPublicId, 'true');
          } catch {}
          setIsAdmitted(true);
          setAdmissionStatus('ADMITTED');
        } else if (e.newValue === 'DECLINED') {
          setAdmissionStatus('DECLINED');
        }
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(knockTimer);
      bc.removeEventListener('message', handleMessage);
      bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [isAdvocateHost, isAdmitted, hasEnteredRoom, roomPublicId, effectiveUser.publicId, effectiveUser.fullName, effectiveUser.role]);

  // Advocate Host: Listen for knocks from joining clients and guests
  useEffect(() => {
    if (!isAdvocateHost) return;

    const bc = new BroadcastChannel('lawino_knocks_' + roomPublicId);

    const processKnock = (knockData) => {
      if (!knockData || !knockData.id) return;
      try {
        if (localStorage.getItem(`lawino_admit_${roomPublicId}_${knockData.id}`) === 'APPROVED') return;
      } catch {}

      setPendingKnocks((prev) => {
        if (prev.some((k) => k.id === knockData.id)) return prev;
        return [...prev, knockData];
      });
    };

    const handleMessage = (e) => {
      const data = e.data || {};
      if (data.type === 'KNOCK_REQUEST') {
        processKnock(data);
      }
    };

    bc.addEventListener('message', handleMessage);

    const handleStorage = (e) => {
      if (e.key === `lawino_knock_${roomPublicId}` && e.newValue) {
        try {
          processKnock(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      bc.removeEventListener('message', handleMessage);
      bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [isAdvocateHost, roomPublicId]);

  const handleAdmitKnock = (knock) => {
    const bc = new BroadcastChannel('lawino_knocks_' + roomPublicId);
    bc.postMessage({ type: 'KNOCK_ADMIT', targetId: knock.id, approved: true });
    bc.close();
    try {
      localStorage.setItem(`lawino_admit_${roomPublicId}_${knock.id}`, 'APPROVED');
    } catch {}
    setPendingKnocks((prev) => prev.filter((k) => k.id !== knock.id));
  };

  const handleDenyKnock = (knock) => {
    const bc = new BroadcastChannel('lawino_knocks_' + roomPublicId);
    bc.postMessage({ type: 'KNOCK_ADMIT', targetId: knock.id, approved: false });
    bc.close();
    try {
      localStorage.setItem(`lawino_admit_${roomPublicId}_${knock.id}`, 'DECLINED');
    } catch {}
    setPendingKnocks((prev) => prev.filter((k) => k.id !== knock.id));
  };

  const handleSimulateKnock = () => {
    const dummyKnock = {
      id: `client_sim_${Date.now()}`,
      name: 'Rohan Verma (Client Party)',
      role: 'CLIENT',
      timestamp: Date.now(),
    };
    setPendingKnocks((prev) => [...prev, dummyKnock]);
  };

  // Overall call duration counter
  useEffect(() => {
    if (!hasEnteredRoom) return;
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [hasEnteredRoom]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const shareableUrl = `${window.location.origin}/meeting/${roomPublicId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendInCallMessage(chatInput.trim());
    setChatInput('');
  };

  const getExitRoute = () => {
    if (authUser?.role === 'LAWYER') return '/lawyer';
    if (authUser?.role === 'FIRM_ADMIN') return '/firm';
    if (authUser?.role === 'CLIENT') return '/client';
    return '/';
  };

  const handleEndCall = async () => {
    if (isRecording) {
      stopRecording();
    }
    await endCall();
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(getExitRoute());
    }
  };

  const handleDestroyRoom = async () => {
    if (isRecording) {
      stopRecording();
    }
    await destroyRoom();
  };

  // =========================================================================
  // PRE-JOIN SCREEN (Lobby for guests joining through share link)
  // =========================================================================
  if (!hasEnteredRoom) {
    return (
      <div className="min-h-screen w-screen bg-[#0C121E] text-white flex flex-col justify-center items-center p-4 selection:bg-[#941B2B]/20">
        <div className="max-w-md w-full bg-[#131B2E] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#941B2B]/20 border border-[#941B2B]/40 text-[#E5A952] flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-serif font-bold text-2xl text-cream-50">Lawino Legal Consultation</h1>
            <p className="text-xs text-slate-400 font-sans">
              Enter your name to join the encrypted chamber via verified share link.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!guestName.trim()) return;
              localStorage.setItem('lawino_guest_name', guestName.trim());
              setHasEnteredRoom(true);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your Legal Display Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Adv. Shalini Nair / Rajesh Gupta (Co-Petitioner)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#E5A952] focus:ring-1 focus:ring-[#E5A952]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Consultation Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'LAWYER', label: 'Advocate / Counsel' },
                  { id: 'CLIENT', label: 'Client / Party' },
                  { id: 'GUEST', label: 'Co-Counsel / Guest' },
                ].map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setGuestRole(role.id)}
                    className={`py-2 px-2 text-center rounded-xl border text-[11px] font-medium transition cursor-pointer ${
                      guestRole === role.id
                        ? 'border-[#E5A952] bg-[#E5A952]/10 text-[#E5A952] font-bold'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Statutory Client-Advocate Privilege Protected</span>
              </div>
              <p>
                In-browser recordings remain on your local device only and are never uploaded to platform servers.
              </p>
            </div>

            <button
              type="submit"
              disabled={!guestName.trim()}
              className="w-full py-3.5 rounded-xl bg-[#941B2B] hover:bg-[#7e1724] disabled:opacity-50 text-white font-serif font-bold text-sm tracking-wide shadow-lg transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <Video className="w-4 h-4 text-[#E5A952]" />
              <span>Join Consultation Room</span>
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-500 font-mono">
            Room Code: {roomPublicId}
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // WAITING ROOM SCREEN: Non-advocate waiting for lawyer to admit them
  // =========================================================================
  if (!isAdmitted) {
    return (
      <div className="min-h-screen w-screen bg-[#0C121E] text-white flex flex-col justify-center items-center p-4 selection:bg-[#941B2B]/20">
        <div className="max-w-lg w-full bg-[#131B2E] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#E5A952]/10 border border-[#E5A952]/30 text-[#E5A952] flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="font-serif font-bold text-2xl text-cream-50">
              Virtual Consultation Waiting Room
            </h1>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Advocate-Client privilege safeguards this chamber. The presiding advocate must admit you before the consultation starts.
            </p>
          </div>

          {/* Camera / Audio Self-Preview */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-inner flex items-center justify-center">
            <video
              ref={lobbyVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${lobbyVideoOff ? 'hidden' : 'block'}`}
            />
            {lobbyVideoOff && (
              <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                <VideoOff className="w-8 h-8 text-slate-500" />
                <span className="text-xs">Camera is turned off</span>
              </div>
            )}

            {/* Self-Preview Overlay Pill */}
            <div className="absolute bottom-3 left-3 flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur text-[11px] font-medium text-slate-200 border border-white/10">
                {effectiveUser.fullName} (Ready)
              </span>
            </div>

            {/* In-Lobby Mic / Video Toggles */}
            <div className="absolute bottom-3 right-3 flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => {
                  if (lobbyStream) {
                    const audioTrack = lobbyStream.getAudioTracks()[0];
                    if (audioTrack) audioTrack.enabled = !audioTrack.enabled;
                    setLobbyMuted(!audioTrack?.enabled);
                  }
                }}
                className={`p-2 rounded-xl backdrop-blur transition cursor-pointer ${
                  lobbyMuted ? 'bg-rose-600/80 text-white' : 'bg-black/60 hover:bg-black/80 text-slate-200'
                }`}
                title={lobbyMuted ? 'Unmute' : 'Mute'}
              >
                {lobbyMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (lobbyStream) {
                    const videoTrack = lobbyStream.getVideoTracks()[0];
                    if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
                    setLobbyVideoOff(!videoTrack?.enabled);
                  }
                }}
                className={`p-2 rounded-xl backdrop-blur transition cursor-pointer ${
                  lobbyVideoOff ? 'bg-rose-600/80 text-white' : 'bg-black/60 hover:bg-black/80 text-slate-200'
                }`}
                title={lobbyVideoOff ? 'Turn Video On' : 'Turn Video Off'}
              >
                {lobbyVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Live Knocking / Admission Status Banner */}
          {admissionStatus === 'DECLINED' ? (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold text-rose-400">
                <AlertCircle className="w-4 h-4" />
                <span>Admission Request Declined</span>
              </div>
              <p className="leading-relaxed">
                The presiding advocate is unable to admit additional attendees into this chamber at this moment.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-xs space-y-2.5">
              <div className="flex items-center space-x-2.5 text-amber-400 font-bold">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                <span>Knocked on Chamber Door — Waiting for Advocate</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Advocate has received your knock notification. Please remain on this screen; you will be placed directly into the consultation room the moment counsel approves your entry.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                if (lobbyStream) lobbyStream.getTracks().forEach((t) => t.stop());
                navigate(getExitRoute());
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              Cancel &amp; Leave
            </button>

            <span className="text-[11px] font-mono text-slate-500">
              Chamber: {roomPublicId}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total in-room participants
  const totalCount = 1 + participants.length;

  return (
    <div className="relative h-screen w-screen bg-[#0A0D16] text-white flex flex-col overflow-hidden select-none font-sans">
      {/* =====================================================================
          TOP HEADER BAR
          ====================================================================== */}
      <header className="h-16 px-4 sm:px-6 bg-[#0E1524]/90 backdrop-blur border-b border-slate-800/80 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsConfirmEndOpen(true)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            title="Leave Consultation"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif font-bold text-sm tracking-wide text-white">
                Legal Consultation Chamber
              </span>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                <Lock className="w-3 h-3" />
                <span>WebRTC Mesh Encrypted (SRTP)</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
              Room ID: <strong className="text-slate-300 font-semibold">{roomPublicId}</strong>
            </p>
          </div>
        </div>

        {/* Center: Live Recording Indicator */}
        {isRecording && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 animate-pulse text-xs font-mono shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="font-bold">REC {formatTime(recordingDuration)}</span>
            <span className="hidden md:inline text-[10px] text-rose-300/80 border-l border-rose-800 pl-2">
              Local System Only
            </span>
          </div>
        )}

        {/* Header Right Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Active Participants Count */}
          <button
            type="button"
            onClick={() => setIsParticipantsOpen((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center space-x-1.5 transition cursor-pointer"
            title="View In-Room Participants"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>{totalCount} {totalCount === 1 ? 'Person' : 'People'}</span>
          </button>

          {/* Share Link Button */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#E5A952] hover:bg-[#d69940] text-slate-950 text-xs font-bold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
            title="Share Room Link"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share Link</span>
          </button>

          {/* Advocate Host: Quick Simulation Button */}
          {isAdvocateHost && (
            <button
              type="button"
              onClick={handleSimulateKnock}
              className="hidden xl:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-amber-300 transition cursor-pointer"
              title="Simulate incoming client knock to test admission control"
            >
              <UserPlus className="w-3 h-3" />
              <span>Test Knock</span>
            </button>
          )}

          {/* Call Duration */}
          <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{formatDuration(callDuration)}</span>
          </div>
        </div>
      </header>

      {/* =====================================================================
          MAIN VIDEO VIEW AREA (DYNAMIC MULTI-PARTICIPANT GRID)
          ====================================================================== */}
      <div className="flex-1 relative flex items-center justify-center p-3 sm:p-4 overflow-hidden">
        {/* Floating Admission Knock Banner (Advocate Host only) */}
        {isAdvocateHost && pendingKnocks.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] bg-[#12192A]/95 border border-[#E5A952]/60 rounded-2xl p-3.5 px-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300 ring-2 ring-[#E5A952]/20">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-[#E5A952]/20 border border-[#E5A952]/40 text-[#E5A952] flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 animate-pulse" />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-serif font-bold text-cream-50 truncate flex items-center space-x-1.5">
                  <span>{pendingKnocks[0].name}</span>
                  <span className="text-[10px] text-amber-300 font-sans font-normal">wants to join</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-sans">
                  {pendingKnocks[0].role === 'CLIENT' ? 'Verified Client / Party' : 'Guest via Share Link'} • Waiting in Lobby
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDenyKnock(pendingKnocks[0])}
                className="px-2.5 py-1.5 rounded-xl border border-slate-700 hover:bg-rose-950/40 text-rose-300 hover:border-rose-500/40 text-xs font-medium transition cursor-pointer"
              >
                Deny
              </button>
              <button
                type="button"
                onClick={() => handleAdmitKnock(pendingKnocks[0])}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-900/30"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Admit Entry</span>
              </button>
            </div>
          </div>
        )}
        {/* Dynamic Grid Layout */}
        <div
          className={`w-full h-full max-w-7xl max-h-full grid gap-3 sm:gap-4 transition-all duration-300 ${
            totalCount === 1
              ? 'grid-cols-1'
              : totalCount === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : totalCount <= 4
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {/* Tile 1: Local User Video Feed */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-center group">
            <video
              id="local-video-feed"
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity ${
                isVideoOff ? 'opacity-0' : 'opacity-100'
              }`}
            />

            {/* Video Off Placeholder */}
            {isVideoOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#12192A] to-[#0A0E18]">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#941B2B] to-[#E5A952] text-white flex items-center justify-center text-3xl sm:text-4xl font-serif font-black shadow-2xl ring-4 ring-white/10">
                  {effectiveUser.fullName?.charAt(0)?.toUpperCase() || 'Y'}
                </div>
                <p className="mt-3 text-xs text-slate-300 font-medium">Camera is Off</p>
              </div>
            )}

            {/* Local Tile Top Badge */}
            <div className="absolute top-3 left-3 flex items-center space-x-1.5">
              <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px] font-mono text-emerald-400 font-semibold border border-white/10">
                You ({effectiveUser.role})
              </span>
              {isScreenSharing && (
                <span className="px-2 py-0.5 rounded-full bg-blue-600/80 backdrop-blur text-[10px] font-bold text-white">
                  Sharing Screen
                </span>
              )}
            </div>

            {/* Local Tile Bottom Name Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur border border-white/10">
              <span className="font-semibold text-white truncate max-w-[180px]">
                {effectiveUser.fullName} (Host)
              </span>
              <div className="flex items-center space-x-1.5">
                {isAudioMuted ? (
                  <span className="p-1 rounded bg-rose-600/80 text-white" title="Muted">
                    <MicOff className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="p-1 rounded bg-emerald-600/80 text-white" title="Unmuted">
                    <Mic className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tiles 2..N: Remote Participants */}
          {participants.map((participant) => (
            <ParticipantTile
              key={participant.id}
              participant={participant}
              onPin={() => setPinnedParticipantId(participant.id)}
            />
          ))}

          {/* Prompt card when alone in room */}
          {totalCount === 1 && (
            <div className="absolute top-6 right-6 max-w-xs p-4 rounded-2xl bg-[#0E1524]/90 backdrop-blur border border-slate-700/80 shadow-2xl space-y-3 z-10 text-xs">
              <div className="flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-[#E5A952] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Alone in the chamber</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Share the invitation link with clients, advocates, or witnesses to join directly.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-[#941B2B] hover:bg-[#7e1724] text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Invite Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    addSimulatedParticipant({
                      id: `adv_raghavan_${Date.now()}`,
                      name: 'Adv. Raghavan Nambiar',
                      role: 'SENIOR_ADVOCATE',
                    })
                  }
                  className="py-1.5 px-2.5 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
                  title="Simulate Co-Counsel for Multi-Party Test"
                >
                  + Test Peer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* =====================================================================
            IN-CALL CHAT DRAWER
            ====================================================================== */}
        {isChatOpen && (
          <div className="absolute top-3 right-3 bottom-3 w-80 sm:w-96 bg-[#0E1524]/95 backdrop-blur-md border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden animate-in slide-in-from-right duration-200 text-xs">
            {/* Chat Header */}
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-[#E5A952]" />
                <span className="font-serif font-bold text-sm text-white">Chamber In-Call Chat</span>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages List */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-xl border ${
                    msg.senderRole === 'SYSTEM'
                      ? 'bg-blue-950/40 border-blue-900/50 text-blue-200 text-[11px]'
                      : 'bg-slate-900/80 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-bold text-[#E5A952]">{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Type a confidential note or document link..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#E5A952]"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 rounded-xl bg-[#941B2B] hover:bg-[#7e1724] disabled:opacity-40 text-white transition cursor-pointer"
              >
                <Send className="w-4 h-4 text-[#E5A952]" />
              </button>
            </form>
          </div>
        )}

        {/* =====================================================================
            IN-CALL PARTICIPANTS DRAWER
            ====================================================================== */}
        {isParticipantsOpen && (
          <div className="absolute top-3 right-3 bottom-3 w-80 bg-[#0E1524]/95 backdrop-blur-md border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden animate-in slide-in-from-right duration-200 text-xs">
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#E5A952]" />
                <span className="font-serif font-bold text-sm text-white">
                  Active Participants ({totalCount})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsParticipantsOpen(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-2">
              {/* Local User */}
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{effectiveUser.fullName} (You)</p>
                  <p className="text-[10px] text-slate-400">{effectiveUser.role} • Chamber Host</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  Active
                </span>
              </div>

              {/* Remotes */}
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">{p.name}</p>
                    <p className="text-[10px] text-slate-400">{p.role}</p>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {p.isSimulated && (
                      <button
                        type="button"
                        onClick={() => removeSimulatedParticipant(p.id)}
                        className="text-[10px] text-rose-400 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-900 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsParticipantsOpen(false);
                  setIsShareModalOpen(true);
                }}
                className="w-full py-2 rounded-xl bg-[#E5A952] hover:bg-[#d69940] text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite More Participants</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          FLOATING BOTTOM MEDIA CONTROLS DOCK
          ====================================================================== */}
      <footer className="h-20 bg-[#0E1524]/95 backdrop-blur border-t border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
        {/* Left Side: Room details & local storage assurance */}
        <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <span>Local Storage: Device Downloads Folder</span>
        </div>

        {/* Center: Main Media Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4 mx-auto md:mx-0">
          {/* Mic Toggle */}
          <button
            type="button"
            onClick={toggleAudio}
            className={`p-3.5 rounded-2xl transition shadow-lg cursor-pointer ${
              isAudioMuted
                ? 'bg-rose-600 text-white hover:bg-rose-700 ring-2 ring-rose-500/40'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
            title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera Toggle */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`p-3.5 rounded-2xl transition shadow-lg cursor-pointer ${
              isVideoOff
                ? 'bg-rose-600 text-white hover:bg-rose-700 ring-2 ring-rose-500/40'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* Screen Share Toggle */}
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-2xl transition shadow-lg cursor-pointer flex items-center space-x-1.5 ${
              isScreenSharing
                ? 'bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-500/40'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
            title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen (Presentation / Document Review)'}
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
            <span className="hidden lg:inline text-xs font-semibold">
              {isScreenSharing ? 'Sharing' : 'Share Screen'}
            </span>
          </button>

          {/* LOCAL DEVICE IN-BROWSER RECORDING CONTROLS */}
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition shadow-lg cursor-pointer border border-rose-500/30 flex items-center space-x-2"
              title="Record Meeting to Local Device Downloads"
            >
              <Circle className="w-5 h-5 fill-rose-500 text-rose-500" />
              <span className="hidden sm:inline text-xs font-bold text-white">Record</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-rose-950/80 border border-rose-500/50 shadow-xl">
              {isPaused ? (
                <button
                  type="button"
                  onClick={resumeRecording}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
                  title="Resume Recording"
                >
                  <Play className="w-4 h-4 text-emerald-400" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pauseRecording}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
                  title="Pause Recording"
                >
                  <Pause className="w-4 h-4 text-amber-400" />
                </button>
              )}

              <button
                type="button"
                onClick={stopRecording}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                title="Stop Recording and Save Video to Downloads Folder"
              >
                <Download className="w-4 h-4" />
                <span>Save to Downloads</span>
              </button>
            </div>
          )}

          {/* In-Call Chat Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsChatOpen((prev) => !prev)}
            className={`p-3.5 rounded-2xl transition shadow-lg relative cursor-pointer ${
              isChatOpen ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title="In-Call Notes & Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={() => setIsConfirmEndOpen(true)}
            className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-xl transition ring-4 ring-rose-600/30 cursor-pointer ml-2"
            title="Leave Consultation Room"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        {/* Right Side: Quick Invite link copy */}
        <div className="hidden md:flex items-center space-x-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied' : 'Copy Link'}</span>
          </button>
        </div>
      </footer>

      {/* =====================================================================
          MODAL: SHARE LINK & INVITE PARTICIPANTS
          ====================================================================== */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#101728] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-white">Invite Consultation Participants</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Anyone with this link can join the video chamber from PC or phone browser.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* URL Box */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-300">
                Shareable Consultation URL
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 rounded-xl bg-[#E5A952] hover:bg-[#d69940] text-slate-950 font-bold flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* 1-Click Social Shares */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Join Lawino Meet Legal Consultation Chamber: ${shareableUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 text-white font-semibold text-center flex items-center justify-center space-x-1.5 transition"
              >
                <span>Share on WhatsApp</span>
              </a>

              <a
                href={`mailto:?subject=Lawino%20Meet%20Chamber%20Link&body=Please%20join%20the%20privileged%20legal%20consultation%20room%20here:%20${encodeURIComponent(
                  shareableUrl
                )}`}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-center flex items-center justify-center space-x-1.5 transition"
              >
                <span>Email Invitation</span>
              </a>
            </div>

            {/* Privacy Assurance */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-200">Legal Privacy Notice:</span>
              <p>
                This room is encrypted. If participants record the session, the video is saved directly into their personal device Downloads folder with 0 server copies.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: RECORDING SAVED TO LOCAL DOWNLOADS NOTIFICATION
          ====================================================================== */}
      {savedFileInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#101728] border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg">
              <Download className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-white">
                Recording Saved to Local Device
              </h3>
              <p className="text-slate-300 text-xs">
                Your consultation video has been compiled and downloaded directly into your system's{' '}
                <strong className="text-emerald-400 font-semibold">Downloads</strong> folder.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-1 font-mono text-[11px]">
              <div className="text-slate-400 truncate">
                File: <strong className="text-slate-200">{savedFileInfo.fileName}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>File Size: {savedFileInfo.sizeMb} MB</span>
                <span>Time: {savedFileInfo.savedAt}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-[11px]">
              🔒 <strong>Strict Statutory Escrow Privacy:</strong> Stored on your device only. Zero bytes uploaded to Lawino servers.
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={clearSavedNotification}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          CONFIRM LEAVE / END CALL MODAL
          ====================================================================== */}
      {isConfirmEndOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#101728] border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center text-xs animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <PhoneOff className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isAdvocateHost ? 'Conclude or Leave Chamber' : 'Leave Consultation Chamber?'}
            </h3>
            <p className="text-slate-400 leading-relaxed">
              {isRecording
                ? 'An active recording is in progress. Ending or leaving will automatically save the recorded video to your Downloads folder.'
                : isAdvocateHost
                ? 'As presiding advocate, you can conclude the consultation and destroy the chamber for all parties, or step out temporarily.'
                : 'Are you sure you want to leave this legal consultation session?'}
            </p>

            {isAdvocateHost ? (
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleDestroyRoom}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold flex items-center justify-center space-x-2 shadow-lg transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Conclude &amp; Destroy Room for Everyone</span>
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmEndOpen(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 transition cursor-pointer"
                  >
                    Stay in Room
                  </button>
                  <button
                    type="button"
                    onClick={handleEndCall}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer"
                  >
                    Leave Temporarily
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmEndOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 transition cursor-pointer"
                >
                  Stay in Room
                </button>
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md transition cursor-pointer"
                >
                  Leave Room
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          OVERLAY: CHAMBER DESTROYED / CONCLUDED
          ====================================================================== */}
      {isRoomDestroyed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070B14]/95 backdrop-blur-md p-4 animate-in fade-in duration-300 select-none">
          <div className="bg-[#101728] border border-slate-700/80 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl text-center text-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-serif font-bold text-xl text-white">
                Consultation Concluded &amp; Chamber Destroyed
              </h2>
              <p className="text-slate-300 text-xs leading-relaxed">
                {destroyReason?.message ||
                  'The presiding advocate has concluded this legal consultation session and permanently destroyed the chamber for all participants.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-slate-400">
                <span>Concluded By:</span>
                <strong className="text-white font-serif">{destroyReason?.destroyedBy || 'Presiding Advocate'}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Chamber Duration:</span>
                <strong className="text-white font-mono">{formatDuration(callDuration)}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Access Status:</span>
                <span className="text-rose-400 font-mono font-bold uppercase tracking-wider text-[10px]">
                  Permanently Deactivated
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (window.history.state && window.history.state.idx > 0) {
                    navigate(-1);
                  } else {
                    navigate(getExitRoute());
                  }
                }}
                className="w-full py-3.5 rounded-xl bg-[#941B2B] hover:bg-[#7e1724] text-white font-serif font-bold text-xs tracking-wide transition shadow-lg cursor-pointer"
              >
                Return to Dashboard / Previous Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * ParticipantTile Component
 * Renders an individual remote participant's video feed or avatar with status badges
 */
const ParticipantTile = ({ participant, onPin }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const hasVideoStream = participant.stream && participant.stream.getVideoTracks().length > 0;

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-center group">
      {/* Remote Video Element */}
      <video
        id={`remote-video-${participant.id}`}
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${hasVideoStream ? 'block' : 'hidden'}`}
      />

      {/* Fallback Avatar when Video Off or Simulated */}
      {!hasVideoStream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#12192A] via-[#1a1215] to-[#0A0E18]">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#941B2B] to-[#E5A952] text-white flex items-center justify-center text-3xl sm:text-4xl font-serif font-black shadow-2xl ring-4 ring-white/10">
            {participant.name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <p className="mt-3 text-xs text-slate-300 font-medium">{participant.name}</p>
          <span className="text-[10px] text-[#E5A952] font-mono mt-0.5">{participant.role}</span>
        </div>
      )}

      {/* Top Left Status Badge */}
      <div className="absolute top-3 left-3 flex items-center space-x-1.5">
        <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px] font-mono text-emerald-400 font-semibold border border-white/10">
          {participant.role}
        </span>
      </div>

      {/* Bottom Name Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur border border-white/10">
        <span className="font-semibold text-white truncate max-w-[180px]">{participant.name}</span>
        <div className="flex items-center space-x-1.5">
          {participant.isMuted ? (
            <span className="p-1 rounded bg-rose-600/80 text-white" title="Muted">
              <MicOff className="w-3 h-3" />
            </span>
          ) : (
            <span className="p-1 rounded bg-emerald-600/80 text-white" title="Active Audio">
              <Mic className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
