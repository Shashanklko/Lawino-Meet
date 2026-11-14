import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Share2,
  MessageSquare,
  ShieldCheck,
  Lock,
  Clock,
  ArrowLeft,
  X,
  Send,
} from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../api/chatApi';

export const VideoMeetingPage = () => {
  const { roomPublicId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    localStream,
    remoteStream,
    room,
    isConnected,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    error,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    endCall,
  } = useWebRTC(roomPublicId, user);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [callDuration, setCallDuration] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isConfirmEndOpen, setIsConfirmEndOpen] = useState(false);

  // Bind local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Bind remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Timer counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    await endCall();
    navigate(user?.role === 'LAWYER' ? '/dashboard/lawyer' : '/dashboard/client');
  };

  const handleSendInCallMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: user?.username || 'Me',
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setChatInput('');
  };

  return (
    <div className="relative h-screen w-screen bg-slate-950 text-white flex flex-col overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="h-16 px-6 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between z-30">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-sm tracking-wide text-white">
                Legal Consultation Room
              </h1>
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                <Lock className="w-3 h-3" />
                <span>WebRTC Encrypted (SRTP)</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Room ID: {roomPublicId?.substring(0, 8)}...
            </p>
          </div>
        </div>

        {/* Timer & Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{formatDuration(callDuration)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-xs text-slate-300">
              {isConnected ? 'Connected' : 'Waiting for participant'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Video View Area */}
      <div className="flex-1 relative flex items-center justify-center bg-slate-950 p-4">
        {/* Remote Video Stream or Waiting State */}
        {remoteStream ? (
          <div className="w-full h-full rounded-2xl overflow-hidden bg-black relative flex items-center justify-center shadow-2xl">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-sm">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center">
                <Video className="w-10 h-10 text-blue-400 animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                Waiting
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Waiting for other party to join</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                The consultation will automatically start with encrypted HD video as soon as the advocate or client enters.
              </p>
            </div>
          </div>
        )}

        {/* Local Video Stream PIP (Picture in Picture) */}
        <div className="absolute bottom-24 right-6 w-56 sm:w-64 aspect-video rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-2xl z-20">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
          />
          {isVideoOff && (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
              <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
              <span>Camera Off</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur text-[10px] font-medium text-white">
            You ({user?.username})
          </div>
        </div>

        {/* In-Call Chat Drawer (Slide-out) */}
        {isChatOpen && (
          <div className="absolute top-4 right-4 bottom-24 w-80 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-30 overflow-hidden">
            <div className="p-3 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold">In-Call Consultation Chat</span>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-center text-[11px]">
                  Share document links or brief notes during the hearing.
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span className="font-semibold text-blue-400">{m.sender}</span>
                      <span>{m.time}</span>
                    </div>
                    <p className="text-slate-200">{m.text}</p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleSendInCallMessage}
              className="p-2 bg-slate-800 border-t border-slate-700 flex items-center space-x-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type note or link..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 rounded-lg bg-blue-600 disabled:opacity-40 text-white hover:bg-blue-700"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Floating Bottom Media Controls Dock */}
      <footer className="h-20 bg-slate-900/90 backdrop-blur border-t border-slate-800 px-6 flex items-center justify-center space-x-4 z-30">
        {/* Mic Toggle */}
        <button
          onClick={toggleAudio}
          className={`p-3.5 rounded-2xl transition shadow-lg ${
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
          onClick={toggleVideo}
          className={`p-3.5 rounded-2xl transition shadow-lg ${
            isVideoOff
              ? 'bg-rose-600 text-white hover:bg-rose-700 ring-2 ring-rose-500/40'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
          }`}
          title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={toggleScreenShare}
          className={`p-3.5 rounded-2xl transition shadow-lg ${
            isScreenSharing
              ? 'bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-500/40'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
          }`}
          title="Share Screen"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* In-Call Chat Drawer Toggle */}
        <button
          onClick={() => setIsChatOpen((prev) => !prev)}
          className={`p-3.5 rounded-2xl transition shadow-lg ${
            isChatOpen
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
          }`}
          title="In-Call Notes & Chat"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* End Call Button */}
        <button
          onClick={() => setIsConfirmEndOpen(true)}
          className="p-3.5 rounded-2xl bg-rose-600 text-white hover:bg-rose-700 shadow-xl transition ring-4 ring-rose-600/30 ml-4"
          title="Leave or End Consultation"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </footer>

      {/* Confirm End Call Modal */}
      {isConfirmEndOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <PhoneOff className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Leave Consultation Room?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to end this legal consultation? The session duration and attendance will be recorded.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setIsConfirmEndOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
              >
                Stay in Room
              </button>
              <button
                onClick={handleEndCall}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition"
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
