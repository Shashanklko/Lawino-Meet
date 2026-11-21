import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Share2,
  MessageSquare,
  Shield,
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Lock,
  User,
  Send,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../context/AuthContext';
import { meetingApi } from '../api/meetingApi';
import { appointmentApi } from '../api/appointmentApi';

export const VideoMeetingPage = () => {
  const { roomPublicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [sessionOutcome, setSessionOutcome] = useState('COMPLETED'); // 'COMPLETED' | 'INCOMPLETE'
  const [incompleteReason, setIncompleteReason] = useState('NO_SHOW');
  const [issueNotes, setIssueNotes] = useState('');
  const [isSubmittingOutcome, setIsSubmittingOutcome] = useState(false);
  const [outcomeSubmitted, setOutcomeSubmitted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // WebRTC & Media Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const stompClientRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const iceServersRef = useRef([
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
  ]);
  const timerRef = useRef(null);

  const isLawyer = user?.role === 'LAWYER';
  const otherPartyRole = isLawyer ? 'CLIENT' : 'ADVOCATE';
  const otherPartyName = isLawyer
    ? meetingDetails?.clientUsername || 'Client'
    : meetingDetails?.lawyerUsername ? `Adv. ${meetingDetails.lawyerUsername}` : 'Counsel';

  // 1. Initialize ICE Servers & Room Details
  useEffect(() => {
    let isMounted = true;

    const initMeeting = async () => {
      try {
        setLoading(true);

        // Fetch ICE Servers
        try {
          const iceRes = await meetingApi.getIceServers();
          if (iceRes?.data && iceRes.data.length > 0) {
            iceServersRef.current = iceRes.data;
          }
        } catch (e) {
          console.warn('Using fallback Google STUN servers:', e);
        }

        // Fetch Meeting Room Details
        const roomRes = await meetingApi.getMeetingRoom(roomPublicId);
        if (!isMounted) return;

        if (roomRes?.data) {
          setMeetingDetails(roomRes.data);
          if (roomRes.data.roomStatus === 'ENDED') {
            setError('This legal consultation session has concluded.');
            setLoading(false);
            return;
          }
        }

        // Initialize User Media (Camera & Mic)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Call join meeting API
        try {
          await meetingApi.joinMeeting(roomPublicId);
        } catch (err) {
          console.warn('Join meeting recording:', err);
        }

        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error('Initialization error:', err);
        setError(
          err?.response?.data?.message ||
          err?.message ||
          'Failed to initialize consultation chamber media devices.'
        );
        setLoading(false);
      }
    };

    initMeeting();

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomPublicId]);

  // Ensure local video element displays local camera stream once loading completes
  useEffect(() => {
    if (!loading && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [loading]);

  // 2. Setup WebRTC Peer Connection & STOMP Signaling
  useEffect(() => {
    if (loading || error || !localStreamRef.current) return;

    // Helper to send WebRTC signaling message via STOMP with REST relay fallback
    const sendSignal = (type, data) => {
      const payload = {
        type,
        senderUserPublicId: user?.publicId,
        data: typeof data === 'object' ? JSON.stringify(data) : data
      };
      if (stompClientRef.current?.connected) {
        try {
          stompClientRef.current.publish({
            destination: `/app/meeting.signal/${roomPublicId}`,
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload)
          });
          return;
        } catch (e) {
          console.warn('STOMP publish failed, falling back to REST:', e);
        }
      }
      // REST relay fallback
      meetingApi.relaySignal(roomPublicId, payload).catch((err) => {
        console.warn('Signaling relay error:', err);
      });
    };

    // Create RTCPeerConnection
    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current,
      iceCandidatePoolSize: 10
    });
    peerConnectionRef.current = pc;

    // Add local tracks to PeerConnection
    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setPeerConnected(true);
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        setPeerConnected(true);
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        setPeerConnected(false);
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        setPeerConnected(true);
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        setPeerConnected(false);
      }
    };

    // ICE Candidate generation -> Send over STOMP / REST
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('CANDIDATE', event.candidate);
      }
    };

    const flushPendingIceCandidates = async () => {
      while (pendingCandidatesRef.current.length > 0) {
        const cand = pendingCandidatesRef.current.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (err) {
          console.warn('Error applying queued ICE candidate:', err);
        }
      }
    };

    const initiateOffer = async () => {
      if (!pc || (pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer')) return;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal('OFFER', offer);
      } catch (err) {
        console.warn('Error initiating WebRTC offer:', err);
      }
    };

    // STOMP WebSocket Client setup
    const token = localStorage.getItem('lawino_token');
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws-meeting'),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 4000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: () => {},
    });

    client.onConnect = () => {
      setIsConnected(true);

      // Subscribe to room signaling channel
      client.subscribe(`/topic/rooms/${roomPublicId}`, async (message) => {
        try {
          const payload = typeof message.body === 'string' ? JSON.parse(message.body) : message.body;
          if (payload.senderUserPublicId === user?.publicId) return; // Ignore self

          if (payload.type === 'USER_JOINED') {
            if (isLawyer) {
              await initiateOffer();
            } else {
              // Client announces ready state to lawyer
              sendSignal('PEER_READY', 'READY');
            }
          } else if (payload.type === 'PEER_READY') {
            if (isLawyer) {
              await initiateOffer();
            }
          } else if (payload.type === 'OFFER') {
            const offerObj = typeof payload.data === 'string' ? JSON.parse(payload.data) : payload.data;
            await pc.setRemoteDescription(new RTCSessionDescription(offerObj));
            await flushPendingIceCandidates();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal('ANSWER', answer);
          } else if (payload.type === 'ANSWER') {
            const answerObj = typeof payload.data === 'string' ? JSON.parse(payload.data) : payload.data;
            await pc.setRemoteDescription(new RTCSessionDescription(answerObj));
            await flushPendingIceCandidates();
          } else if (payload.type === 'CANDIDATE') {
            const candidateObj = typeof payload.data === 'string' ? JSON.parse(payload.data) : payload.data;
            if (candidateObj) {
              if (pc.remoteDescription && pc.remoteDescription.type) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(candidateObj));
                } catch (err) {
                  console.warn('Direct addIceCandidate error:', err);
                }
              } else {
                pendingCandidatesRef.current.push(candidateObj);
              }
            }
          } else if (payload.type === 'ROOM_ENDED') {
            setShowCompletionModal(true);
          } else if (payload.type === 'IN_CALL_MESSAGE') {
            setChatMessages((prev) => [
              ...prev,
              {
                sender: payload.senderName || 'Participant',
                text: payload.data,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }
        } catch (e) {
          console.warn('Signaling message error:', e);
        }
      });

      // Announce arrival to room
      sendSignal('USER_JOINED', 'JOIN');
    };

    client.activate();
    stompClientRef.current = client;

    // Call duration timer
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (client?.connected) {
        client.deactivate();
      }
      if (pc) {
        pc.close();
      }
    };
  }, [loading, error, roomPublicId, user?.publicId, isLawyer]);

  // Audio Toggle
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Video Toggle
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoDisabled(!videoTrack.enabled);
      }
    }
  }, []);

  // Screen Share Toggle
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenSharing();
        };

        setIsScreenSharing(true);
      } else {
        stopScreenSharing();
      }
    } catch (err) {
      console.warn('Screen share canceled or failed:', err);
    }
  };

  const stopScreenSharing = () => {
    if (localStreamRef.current && peerConnectionRef.current) {
      const originalVideoTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        .getSenders()
        .find((s) => s.track && s.track.kind === 'video');
      if (sender && originalVideoTrack) {
        sender.replaceTrack(originalVideoTrack);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    setIsScreenSharing(false);
  };

  // Send In-Meeting Chat
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !stompClientRef.current?.connected) return;

    const msg = {
      sender: user?.username || 'You',
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    stompClientRef.current.publish({
      destination: `/app/meeting.signal/${roomPublicId}`,
      body: JSON.stringify({
        type: 'IN_CALL_MESSAGE',
        senderUserPublicId: user?.publicId,
        senderName: user?.username,
        data: newMessage.trim()
      })
    });

    setChatMessages((prev) => [...prev, msg]);
    setNewMessage('');
  };

  // End Consultation
  const handleEndConsultation = async () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      await meetingApi.endMeeting(roomPublicId);
      setShowCompletionModal(true);
    } catch (err) {
      console.error('Error ending consultation:', err);
      setShowCompletionModal(true);
    }
  };

  const handleConfirmCompletion = async () => {
    setIsSubmittingOutcome(true);
    try {
      if (meetingDetails?.appointmentPublicId) {
        if (isLawyer) {
          await appointmentApi.completeAppointment(meetingDetails.appointmentPublicId);
        } else {
          try {
            await appointmentApi.confirmCompletion(meetingDetails.appointmentPublicId);
          } catch (e) {
            console.warn('Confirm completion error:', e);
          }
        }
      }
      setOutcomeSubmitted(true);
    } catch (err) {
      console.warn('Completion recording error:', err);
      setOutcomeSubmitted(true);
    } finally {
      setIsSubmittingOutcome(false);
    }
  };

  const handleConfirmIncomplete = async () => {
    setIsSubmittingOutcome(true);
    const reasonText = `[Incomplete Consultation] ${incompleteReason}: ${issueNotes || 'Client/Counsel indicated incomplete session'}`;
    try {
      if (meetingDetails?.appointmentPublicId) {
        try {
          await appointmentApi.cancelAppointment(meetingDetails.appointmentPublicId, reasonText);
        } catch (e) {
          console.warn('Incomplete reporting error:', e);
        }
      }
      setOutcomeSubmitted(true);
    } catch (err) {
      console.warn('Incomplete reporting error:', err);
      setOutcomeSubmitted(true);
    } finally {
      setIsSubmittingOutcome(false);
    }
  };

  // Format Timer HH:MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-950 text-white p-6">
        <div className="w-16 h-16 border-4 border-amber-600/40 border-t-amber-500 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-serif font-bold text-amber-100">Connecting to Private Legal Chamber...</h2>
        <p className="text-stone-400 text-sm mt-1">Securing peer-to-peer WebRTC encrypted media pipeline.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-950 text-white p-6">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 max-w-md w-full text-center">
          <Shield className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-100">Consultation Session Closed</h2>
          <p className="text-stone-400 text-sm mt-2">{error}</p>
          <button
            onClick={() => navigate(isLawyer ? '/lawyer' : '/client')}
            className="mt-6 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen bg-stone-950 text-white overflow-hidden select-none">
      {/* 1. Chamber Top Bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-stone-900/90 backdrop-blur border-b border-stone-800/80 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-700 to-amber-500 flex items-center justify-center font-serif font-bold text-white shadow-md">
            LM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-wide text-stone-100">
                1:1 Confidential Legal Consultation Chamber
              </h1>
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-medium">
                <Lock className="w-2.5 h-2.5" /> End-to-End Encrypted
              </span>
            </div>
            <p className="text-xs text-stone-400 font-mono">
              Room ID: {roomPublicId} &bull; Matter Privileged Under Law
            </p>
          </div>
        </div>

        {/* Live Call Timer & Connection Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-stone-950/60 px-3 py-1.5 rounded-lg border border-stone-800 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span className="text-stone-200">{formatDuration(callDuration)}</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${peerConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
            <span className={peerConnected ? 'text-emerald-400' : 'text-amber-400'}>
              {peerConnected ? 'Connected with Peer' : 'Waiting for Peer to Join...'}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main 1:1 Video Call Body */}
      <main className="relative flex-1 flex overflow-hidden">
        {/* Video Canvas Area */}
        <div className="relative flex-1 bg-stone-950 p-4 flex items-center justify-center">
          {/* Main Remote Video (Opposite Party) */}
          <div className="relative w-full h-full max-w-6xl max-h-[82vh] bg-stone-900 rounded-2xl overflow-hidden border border-stone-800/80 shadow-2xl flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover transition-opacity duration-300 ${peerConnected ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Placeholder when Peer hasn't joined or connected yet */}
            {!peerConnected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-stone-900/90">
                <div className="w-20 h-20 rounded-full bg-stone-800 border-2 border-dashed border-amber-600/60 flex items-center justify-center mb-4 text-amber-500">
                  <User className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-semibold text-stone-200">{otherPartyName}</h3>
                <p className="text-xs text-stone-400 max-w-xs mt-1">
                  Private chamber is active and ready. Audio/video stream will appear the moment counsel and client connect.
                </p>
              </div>
            )}

            {/* Remote Peer Label */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-950/80 backdrop-blur border border-stone-800 text-xs font-medium text-stone-200">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isLawyer ? 'bg-blue-900 text-blue-200' : 'bg-amber-900 text-amber-200'
              }`}>
                {otherPartyRole}
              </span>
              <span>{otherPartyName}</span>
            </div>
          </div>

          {/* Self Video (Picture-in-Picture Floating Window) */}
          <div className="absolute bottom-8 right-8 w-56 h-36 bg-stone-900 rounded-xl overflow-hidden border-2 border-stone-700/80 shadow-2xl z-10">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${isVideoDisabled ? 'hidden' : 'block'}`}
            />
            {isVideoDisabled && (
              <div className="w-full h-full flex items-center justify-center bg-stone-800 text-stone-400 text-xs font-medium">
                Camera Off
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-stone-300 backdrop-blur">
              You ({isLawyer ? 'Advocate' : 'Client'})
            </div>
          </div>
        </div>

        {/* 3. Side In-Meeting Chat Drawer (Collapsible) */}
        {isChatOpen && (
          <aside className="w-80 bg-stone-900 border-l border-stone-800 flex flex-col z-20">
            <div className="flex items-center justify-between p-4 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-stone-200">Chamber Briefs & Chat</h3>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {chatMessages.length === 0 ? (
                <div className="text-center text-stone-500 py-8">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No messages exchanged yet.</p>
                  <p className="text-[11px] mt-1">Use this panel to share legal notes or reference section codes during the call.</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl ${
                      msg.sender === (user?.username || 'You')
                        ? 'bg-amber-900/40 border border-amber-800/60 ml-4'
                        : 'bg-stone-800 border border-stone-700/60 mr-4'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-stone-300">{msg.sender}</span>
                      <span className="text-[10px] text-stone-500">{msg.time}</span>
                    </div>
                    <p className="text-stone-200">{msg.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-stone-800 flex gap-2">
              <input
                type="text"
                placeholder="Type in-call legal message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-600"
              />
              <button
                type="submit"
                className="p-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </aside>
        )}
      </main>

      {/* 4. Bottom Call Control Toolbar */}
      <footer className="h-20 bg-stone-900/90 backdrop-blur border-t border-stone-800/80 flex items-center justify-between px-8 z-20">
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Privileged & Confidential Consultation</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Mute Mic */}
          <button
            onClick={toggleAudio}
            className={`p-3.5 rounded-2xl transition shadow-lg ${
              isAudioMuted
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
            }`}
            title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-2xl transition shadow-lg ${
              isVideoDisabled
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
            }`}
            title={isVideoDisabled ? 'Turn On Camera' : 'Turn Off Camera'}
          >
            {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-2xl transition shadow-lg ${
              isScreenSharing
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen / Document'}
          >
            <Share2 className="w-5 h-5" />
          </button>

          {/* In-Meeting Chat Toggle */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-3.5 rounded-2xl transition shadow-lg ${
              isChatOpen
                ? 'bg-amber-600 text-white'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
            }`}
            title="Toggle In-Call Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* End Consultation */}
          <button
            onClick={handleEndConsultation}
            className="px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-2xl flex items-center gap-2 shadow-lg hover:shadow-rose-900/50 transition ml-2"
          >
            <PhoneOff className="w-5 h-5" />
            <span>End Call</span>
          </button>
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-stone-400">
            <div className="font-semibold text-stone-200">{user?.username}</div>
            <div className="text-[11px] capitalize">{user?.role?.toLowerCase()}</div>
          </div>
        </div>
      </footer>

      {/* 5. Consultation Concluded Modal (Completed or Not Completed) */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl animate-in fade-in zoom-in-95 text-stone-200">
            {outcomeSubmitted ? (
              <div className="space-y-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  sessionOutcome === 'COMPLETED'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                    : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                }`}>
                  {sessionOutcome === 'COMPLETED' ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : (
                    <AlertCircle className="w-8 h-8" />
                  )}
                </div>
                <h3 className="text-xl font-serif font-bold text-stone-100">
                  {sessionOutcome === 'COMPLETED' ? 'Consultation Verified Completed' : 'Session Recorded as Incomplete'}
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
                  {sessionOutcome === 'COMPLETED'
                    ? 'Thank you. The session has been verified, and retainer fee escrow is queued for automated release to counsel.'
                    : 'Your report has been securely registered. Retainer escrow is held and protected. Our legal operations support team will review the log.'}
                </p>
                <div className="bg-stone-950 rounded-xl p-3 text-xs text-stone-300 font-mono border border-stone-800">
                  Duration: {formatDuration(callDuration)} &bull; Status: {sessionOutcome === 'COMPLETED' ? 'COMPLETED' : 'INCOMPLETE / REPORTED'}
                </div>
                <button
                  onClick={() => navigate(isLawyer ? '/lawyer' : '/client')}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium rounded-xl shadow-lg transition text-xs"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-stone-800 text-amber-500 border border-stone-700 flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-stone-100">
                    Consultation Concluded
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Call session ended between {meetingDetails?.lawyerUsername ? `Adv. ${meetingDetails.lawyerUsername}` : 'Counsel'} and {meetingDetails?.clientUsername || 'Client'}.
                  </p>
                  <div className="inline-block bg-stone-950 rounded-lg px-3 py-1 my-3 text-[11px] text-stone-400 font-mono border border-stone-800">
                    Duration: {formatDuration(callDuration)}
                  </div>
                </div>

                {/* Outcome Toggle */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-2">
                    How was this legal consultation session?
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSessionOutcome('COMPLETED')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        sessionOutcome === 'COMPLETED'
                          ? 'border-emerald-600 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-600'
                          : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:bg-stone-800/50'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Completed</span>
                      </div>
                      <p className="text-[10px] text-stone-400 font-normal mt-1 leading-snug">
                        Advice concluded. Release escrow fee.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSessionOutcome('INCOMPLETE')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        sessionOutcome === 'INCOMPLETE'
                          ? 'border-rose-600 bg-rose-950/40 text-rose-200 ring-1 ring-rose-600'
                          : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:bg-stone-800/50'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 font-bold text-xs">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>Not Completed</span>
                      </div>
                      <p className="text-[10px] text-stone-400 font-normal mt-1 leading-snug">
                        Hold escrow. Report issue / no-show.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Incomplete Reason Details */}
                {sessionOutcome === 'INCOMPLETE' && (
                  <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/60 space-y-2.5 text-xs">
                    <span className="font-semibold text-rose-300 block text-[11px]">
                      Reason for incomplete consultation:
                    </span>
                    <select
                      value={incompleteReason}
                      onChange={(e) => setIncompleteReason(e.target.value)}
                      className="w-full p-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-rose-500"
                    >
                      <option value="NO_SHOW">Peer was absent / did not join room</option>
                      <option value="TECHNICAL_FAILURE">Audio or video technical breakdown</option>
                      <option value="PREMATURE_DISCONNECT">Call disconnected prematurely</option>
                      <option value="ADVICE_UNFULFILLED">Legal matter unresolved / left early</option>
                      <option value="OTHER">Other technical or scheduling problem</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Optional brief notes on the issue..."
                      value={issueNotes}
                      onChange={(e) => setIssueNotes(e.target.value)}
                      className="w-full p-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-rose-500"
                    />
                    <p className="text-[10px] text-rose-400/90 font-mono">
                      Escrow retainer will remain protected and will NOT be auto-settled.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 space-y-2">
                  {sessionOutcome === 'COMPLETED' ? (
                    <button
                      type="button"
                      disabled={isSubmittingOutcome}
                      onClick={handleConfirmCompletion}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium rounded-xl shadow-lg transition text-xs flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmittingOutcome ? 'Verifying...' : 'Confirm Consultation Completed'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmittingOutcome}
                      onClick={handleConfirmIncomplete}
                      className="w-full py-3 bg-gradient-to-r from-rose-700 to-rose-800 hover:from-rose-600 hover:to-rose-700 text-white font-medium rounded-xl shadow-lg transition text-xs flex items-center justify-center space-x-1.5"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{isSubmittingOutcome ? 'Recording...' : 'Mark Consultation as Not Completed'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate(isLawyer ? '/lawyer' : '/client')}
                    className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium rounded-xl transition text-xs"
                  >
                    Skip &amp; Return to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default VideoMeetingPage;
