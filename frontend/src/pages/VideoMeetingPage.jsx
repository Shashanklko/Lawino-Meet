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
  FileText
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // WebRTC & Media Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const stompClientRef = useRef(null);
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

  // 2. Setup WebRTC Peer Connection & STOMP Signaling
  useEffect(() => {
    if (loading || error || !localStreamRef.current) return;

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

    // ICE Candidate generation -> Send over STOMP
    pc.onicecandidate = (event) => {
      if (event.candidate && stompClientRef.current?.connected) {
        stompClientRef.current.publish({
          destination: `/app/meeting.signal/${roomPublicId}`,
          body: JSON.stringify({
            type: 'CANDIDATE',
            senderUserPublicId: user?.publicId,
            data: JSON.stringify(event.candidate)
          })
        });
      }
    };

    // STOMP WebSocket Client setup
    const token = localStorage.getItem('lawino_token');
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws-meeting'),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 3000,
      debug: () => {},
    });

    client.onConnect = () => {
      setIsConnected(true);

      // Subscribe to room signaling channel
      client.subscribe(`/topic/rooms/${roomPublicId}`, async (message) => {
        try {
          const payload = JSON.parse(message.body);
          if (payload.senderUserPublicId === user?.publicId) return; // Ignore self

          if (payload.type === 'USER_JOINED') {
            // When other peer joins, the Lawyer initiates the offer
            if (isLawyer) {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              client.publish({
                destination: `/app/meeting.signal/${roomPublicId}`,
                body: JSON.stringify({
                  type: 'OFFER',
                  senderUserPublicId: user?.publicId,
                  data: JSON.stringify(offer)
                })
              });
            }
          } else if (payload.type === 'OFFER') {
            const offerObj = JSON.parse(payload.data);
            await pc.setRemoteDescription(new RTCSessionDescription(offerObj));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            client.publish({
              destination: `/app/meeting.signal/${roomPublicId}`,
              body: JSON.stringify({
                type: 'ANSWER',
                senderUserPublicId: user?.publicId,
                data: JSON.stringify(answer)
              })
            });
          } else if (payload.type === 'ANSWER') {
            const answerObj = JSON.parse(payload.data);
            await pc.setRemoteDescription(new RTCSessionDescription(answerObj));
          } else if (payload.type === 'CANDIDATE') {
            const candidateObj = JSON.parse(payload.data);
            if (candidateObj) {
              await pc.addIceCandidate(new RTCIceCandidate(candidateObj));
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
      client.publish({
        destination: `/app/meeting.signal/${roomPublicId}`,
        body: JSON.stringify({
          type: 'USER_JOINED',
          senderUserPublicId: user?.publicId,
          data: 'JOIN'
        })
      });
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

      // If appointmentPublicId is known and user is lawyer, complete appointment
      if (isLawyer && meetingDetails?.appointmentPublicId) {
        try {
          await appointmentApi.completeAppointment(meetingDetails.appointmentPublicId);
        } catch (err) {
          console.warn('Error completing appointment:', err);
        }
      }

      setShowCompletionModal(true);
    } catch (err) {
      console.error('Error ending consultation:', err);
      navigate(isLawyer ? '/lawyer' : '/client');
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
                <div className="mt-4 flex items-center gap-2 text-xs text-amber-400/90 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-900/50">
                  <Sparkles className="w-3.5 h-3.5" /> High Court Bar Compliant Stream
                </div>
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

      {/* 5. Consultation Completed Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-100">Consultation Session Concluded</h3>
            <p className="text-sm text-stone-400 mt-2">
              The 1:1 legal tele-consultation between {meetingDetails?.lawyerUsername ? `Adv. ${meetingDetails.lawyerUsername}` : 'Counsel'} and {meetingDetails?.clientUsername || 'Client'} has been successfully concluded.
            </p>
            <div className="bg-stone-950 rounded-xl p-3 my-5 text-xs text-stone-300 font-mono border border-stone-800">
              Duration: {formatDuration(callDuration)} &bull; Status: COMPLETED
            </div>
            <button
              onClick={() => navigate(isLawyer ? '/lawyer' : '/client')}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium rounded-xl shadow-lg transition"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default VideoMeetingPage;
