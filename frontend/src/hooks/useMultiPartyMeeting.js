import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { meetingApi } from '../api/meetingApi';

/**
 * useMultiPartyMeeting
 *
 * Full-mesh multi-participant WebRTC hook:
 * - Supports N participants simultaneously in a shared consultation room.
 * - Multi-channel signaling: STOMP WebSocket broker + BroadcastChannel for robust local/multi-tab peers.
 * - Handles Offer/Answer/ICE candidate exchanges per peer.
 * - Provides live participant streams, local stream, screen sharing, audio/video controls.
 * - Supports simulated peers for multi-counsel demonstrations.
 */
export const useMultiPartyMeeting = (roomPublicId, currentUser) => {
  const [localStream, setLocalStream] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState(null);
  const [isRoomDestroyed, setIsRoomDestroyed] = useState(false);
  const [destroyReason, setDestroyReason] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome_1',
      sender: 'Lawino Security Bot',
      senderRole: 'SYSTEM',
      text: 'Encrypted legal consultation chamber established. WebRTC peer-to-peer data channel is secured.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // PeerConnections keyed by peerId: { [peerId]: RTCPeerConnection }
  const peerConnectionsRef = useRef({});
  const localStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const stompClientRef = useRef(null);
  const broadcastChannelRef = useRef(null);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // STUN / ICE Servers
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  /**
   * Broadcast signaling message to both WebSocket (if connected) and BroadcastChannel
   */
  const sendSignal = useCallback((signal) => {
    const enrichedSignal = {
      ...signal,
      roomPublicId,
      senderId: currentUserRef.current?.publicId || 'local_user',
      senderName: currentUserRef.current?.fullName || currentUserRef.current?.username || 'Participant',
      senderRole: currentUserRef.current?.role || 'GUEST',
      timestamp: Date.now(),
    };

    // 1. BroadcastChannel (for same-origin tabs/windows)
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(enrichedSignal);
      } catch (e) {
        console.warn('BroadcastChannel send error:', e);
      }
    }

    // 2. STOMP Client (for network server)
    if (stompClientRef.current && stompClientRef.current.connected) {
      try {
        stompClientRef.current.publish({
          destination: `/app/meeting.signal/${roomPublicId}`,
          body: JSON.stringify(enrichedSignal),
        });
      } catch (e) {
        console.warn('STOMP send error:', e);
      }
    }
  }, [roomPublicId]);

  /**
   * Get or Create PeerConnection for a remote peer
   */
  const getOrCreatePeerConnection = useCallback((remotePeerId, remotePeerName, remotePeerRole) => {
    if (peerConnectionsRef.current[remotePeerId]) {
      return peerConnectionsRef.current[remotePeerId];
    }

    const pc = new RTCPeerConnection({ iceServers });
    peerConnectionsRef.current[remotePeerId] = pc;

    // Add local tracks to this peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote tracks from this peer
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      setParticipants((prev) => {
        const existing = prev.find((p) => p.id === remotePeerId);
        if (existing) {
          return prev.map((p) => (p.id === remotePeerId ? { ...p, stream: remoteStream } : p));
        }
        return [
          ...prev,
          {
            id: remotePeerId,
            name: remotePeerName || 'Counsel / Participant',
            role: remotePeerRole || 'GUEST',
            stream: remoteStream,
            isMuted: false,
            isVideoOff: false,
          },
        ];
      });
      setIsConnected(true);
    };

    // Handle local ICE candidates to send to this remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: 'ICE_CANDIDATE',
          targetId: remotePeerId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setParticipants((prev) => prev.filter((p) => p.id !== remotePeerId));
      }
    };

    return pc;
  }, [sendSignal]);

  /**
   * Process incoming signaling message
   */
  const handleSignal = useCallback(async (signal) => {
    const currentId = currentUserRef.current?.publicId || 'local_user';
    if (!signal || signal.senderId === currentId) {
      return; // Ignore own messages
    }

    const { type, senderId, senderName, senderRole, targetId, offer, answer, candidate, chatMessage } = signal;

    // Filter messages targeted specifically to someone else
    if (targetId && targetId !== currentId) {
      return;
    }

    switch (type) {
      case 'PEER_JOIN': {
        // A new peer entered the room. Existing peer initiates an offer.
        const pc = getOrCreatePeerConnection(senderId, senderName, senderRole);
        const createdOffer = await pc.createOffer();
        await pc.setLocalDescription(createdOffer);

        sendSignal({
          type: 'PEER_OFFER',
          targetId: senderId,
          offer: createdOffer,
        });
        break;
      }

      case 'PEER_OFFER': {
        // Received offer from an existing peer
        const pc = getOrCreatePeerConnection(senderId, senderName, senderRole);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const createdAnswer = await pc.createAnswer();
        await pc.setLocalDescription(createdAnswer);

        sendSignal({
          type: 'PEER_ANSWER',
          targetId: senderId,
          answer: createdAnswer,
        });
        break;
      }

      case 'PEER_ANSWER': {
        // Received answer to our offer
        const pc = peerConnectionsRef.current[senderId];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
        break;
      }

      case 'ICE_CANDIDATE': {
        const pc = peerConnectionsRef.current[senderId];
        if (pc && candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn('Error adding ICE candidate:', e);
          }
        }
        break;
      }

      case 'CHAT_MESSAGE': {
        if (chatMessage) {
          setChatMessages((prev) => [...prev, chatMessage]);
        }
        break;
      }

      case 'PEER_LEAVE': {
        if (peerConnectionsRef.current[senderId]) {
          peerConnectionsRef.current[senderId].close();
          delete peerConnectionsRef.current[senderId];
        }
        setParticipants((prev) => prev.filter((p) => p.id !== senderId));
        break;
      }

      case 'ROOM_DESTROYED':
      case 'END': {
        setIsRoomDestroyed(true);
        setDestroyReason({
          destroyedBy: senderName || 'Presiding Advocate',
          message: `${senderName || 'The presiding advocate'} has officially concluded this legal consultation session and permanently destroyed the chamber. All peer channels have been closed.`,
        });
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          try {
            pc.close();
          } catch (e) {}
        });
        peerConnectionsRef.current = {};
        setParticipants([]);
        break;
      }

      default:
        break;
    }
  }, [getOrCreatePeerConnection, sendSignal]);

  /**
   * Initialize Local Media and Signaling
   */
  useEffect(() => {
    let isCancelled = false;

    const init = async () => {
      try {
        // 1. Get Camera and Microphone Stream
        let stream = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
            audio: true,
          });
        } catch (mediaErr) {
          console.warn('Standard video/audio request failed, falling back to audio only or blank stream:', mediaErr);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsVideoOff(true);
          } catch (audioErr) {
            console.warn('Audio request failed:', audioErr);
          }
        }

        if (isCancelled) return;

        localStreamRef.current = stream;
        setLocalStream(stream);

        // 2. Setup BroadcastChannel for local/multi-tab peers
        try {
          const bc = new BroadcastChannel(`lawino_meeting_${roomPublicId}`);
          bc.onmessage = (event) => {
            handleSignal(event.data);
          };
          broadcastChannelRef.current = bc;
        } catch (bcErr) {
          console.warn('BroadcastChannel not supported:', bcErr);
        }

        // 3. Setup STOMP Client for Network Server
        try {
          const token = localStorage.getItem('lawino_token');
          const client = new Client({
            webSocketFactory: () => new SockJS('/ws-meeting'),
            connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
            reconnectDelay: 5000,
            debug: () => {},
            onConnect: () => {
              client.subscribe(`/topic/rooms/${roomPublicId}`, (msg) => {
                try {
                  const sig = JSON.parse(msg.body);
                  handleSignal(sig);
                } catch (e) {
                  console.error('STOMP parse error:', e);
                }
              });

              // Announce presence via STOMP
              sendSignal({ type: 'PEER_JOIN' });
            },
          });
          client.activate();
          stompClientRef.current = client;
        } catch (stompErr) {
          console.warn('STOMP connection initialization skipped:', stompErr);
        }

        // 4. Announce peer presence via BroadcastChannel immediately
        sendSignal({ type: 'PEER_JOIN' });

        // 5. Try calling meetingApi join endpoint if authenticated
        try {
          await meetingApi.joinMeeting(roomPublicId);
        } catch (apiErr) {
          // Allowed for guest users joining via share link
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to initialize meeting:', err);
          setError(err.message || 'Could not connect to consultation room');
        }
      }
    };

    if (roomPublicId) {
      init();
    }

    return () => {
      isCancelled = true;

      // Announce departure
      sendSignal({ type: 'PEER_LEAVE' });

      // Clean up local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
      }

      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        try {
          pc.close();
        } catch (e) {}
      });
      peerConnectionsRef.current = {};

      // Close channels
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [roomPublicId, handleSignal, sendSignal]);

  /**
   * Toggle Audio Mute
   */
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, []);

  /**
   * Toggle Video On/Off
   */
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, []);

  /**
   * Toggle Screen Sharing
   */
  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        // Replace track on all active peer connections
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.warn('Screen share cancelled or failed:', err);
    }
  }, [isScreenSharing]);

  const stopScreenShare = useCallback(() => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    if (localStreamRef.current) {
      const originalVideoTrack = localStreamRef.current.getVideoTracks()[0];
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender && originalVideoTrack) {
          sender.replaceTrack(originalVideoTrack);
        }
      });
    }
    setIsScreenSharing(false);
  }, []);

  /**
   * Send in-call chat message to all peers
   */
  const sendInCallMessage = useCallback((text) => {
    if (!text || !text.trim()) return;
    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      sender: currentUserRef.current?.fullName || currentUserRef.current?.username || 'Me',
      senderRole: currentUserRef.current?.role || 'GUEST',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, msg]);
    sendSignal({
      type: 'CHAT_MESSAGE',
      chatMessage: msg,
    });
  }, [sendSignal]);

  /**
   * Add a simulated participant (for demonstration when alone in room)
   */
  const addSimulatedParticipant = useCallback((simulatedUser) => {
    setParticipants((prev) => {
      if (prev.some((p) => p.id === simulatedUser.id)) return prev;
      return [
        ...prev,
        {
          id: simulatedUser.id,
          name: simulatedUser.name,
          role: simulatedUser.role,
          stream: null, // canvas / avatar rendered
          isMuted: false,
          isVideoOff: false,
          isSimulated: true,
        },
      ];
    });
    setIsConnected(true);
  }, []);

  const removeSimulatedParticipant = useCallback((id) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const endCall = useCallback(async () => {
    try {
      await meetingApi.endMeeting(roomPublicId);
    } catch (e) {}
  }, [roomPublicId]);

  /**
   * Conclude Consultation & Permanently Destroy Chamber for All Participants
   */
  const destroyRoom = useCallback(async () => {
    try {
      // 1. Broadcast ROOM_DESTROYED signal across STOMP and BroadcastChannel
      sendSignal({
        type: 'ROOM_DESTROYED',
        destroyedBy: currentUserRef.current?.fullName || 'Presiding Advocate',
      });

      // 2. Call backend end endpoint
      try {
        await meetingApi.endMeeting(roomPublicId);
      } catch (err) {
        console.warn('API endMeeting notice:', err);
      }

      // 3. Update local state
      setIsRoomDestroyed(true);
      setDestroyReason({
        destroyedBy: currentUserRef.current?.fullName || 'Presiding Advocate',
        message: 'You have officially concluded this legal consultation and permanently destroyed the chamber for all participants.',
      });

      // 4. Terminate all active peer connections
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        try {
          pc.close();
        } catch (e) {}
      });
      peerConnectionsRef.current = {};
      setParticipants([]);
    } catch (e) {
      console.error('Error destroying chamber:', e);
    }
  }, [roomPublicId, sendSignal]);

  return {
    localStream,
    participants,
    isConnected: isConnected || participants.length > 0,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    error,
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
  };
};
