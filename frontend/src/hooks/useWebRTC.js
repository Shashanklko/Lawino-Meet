import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { meetingApi } from '../api/meetingApi';

export const useWebRTC = (roomPublicId, currentUser) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState(null);

  const pcRef = useRef(null);
  const stompClientRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenTrackRef = useRef(null);

  // Initialize WebRTC and Signaling
  const initializeCall = useCallback(async () => {
    try {
      // 1. Fetch Room details & ICE servers
      const roomRes = await meetingApi.getMeetingRoom(roomPublicId);
      if (!roomRes.success || !roomRes.data) {
        throw new Error('Room not found or unauthorized');
      }
      setRoom(roomRes.data);

      const iceRes = await meetingApi.getIceServers(roomPublicId);
      const iceServers = iceRes.data?.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ];

      // 2. Get Local Media Stream (with graceful fallback for insecure HTTP origins)
      let stream = null;
      if (navigator?.mediaDevices?.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch (mediaErr) {
          console.warn('Hardware media device acquisition failed, attempting audio-only:', mediaErr);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          } catch (audioErr) {
            console.warn('Audio-only fallback also failed:', audioErr);
          }
        }
      }

      if (!stream) {
        // Create virtual standby stream when camera/mic is restricted (HTTP origin)
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(0, 0, 640, 480);
          }
          stream = canvas.captureStream ? canvas.captureStream(5) : new MediaStream();
        } catch {
          stream = new MediaStream();
        }
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      // 3. Create PeerConnection
      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;

      // Add local tracks to PeerConnection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle Remote Stream
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          setIsConnected(true);
        }
      };

      // 4. Setup STOMP signaling broker
      const token = localStorage.getItem('lawino_token');
      const client = new Client({
        webSocketFactory: () => new SockJS('/ws-meeting'),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        debug: () => {},
        onConnect: () => {
          // Subscribe to Room Signaling Topic
          client.subscribe(`/topic/rooms/${roomPublicId}`, async (message) => {
            try {
              const signal = JSON.parse(message.body);
              if (signal.senderPublicId === currentUser?.publicId) {
                return; // Ignore own messages
              }

              switch (signal.type) {
                case 'JOIN': {
                  // Other participant joined, create offer
                  const offer = await pc.createOffer();
                  await pc.setLocalDescription(offer);
                  client.publish({
                    destination: `/app/meeting.signal/${roomPublicId}`,
                    body: JSON.stringify({
                      roomPublicId,
                      senderPublicId: currentUser.publicId,
                      type: 'OFFER',
                      payload: JSON.stringify(offer),
                    }),
                  });
                  break;
                }
                case 'OFFER': {
                  const remoteOffer = JSON.parse(signal.payload);
                  await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));
                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);
                  client.publish({
                    destination: `/app/meeting.signal/${roomPublicId}`,
                    body: JSON.stringify({
                      roomPublicId,
                      senderPublicId: currentUser.publicId,
                      type: 'ANSWER',
                      payload: JSON.stringify(answer),
                    }),
                  });
                  break;
                }
                case 'ANSWER': {
                  const remoteAnswer = JSON.parse(signal.payload);
                  await pc.setRemoteDescription(new RTCSessionDescription(remoteAnswer));
                  break;
                }
                case 'ICE_CANDIDATE': {
                  const candidate = JSON.parse(signal.payload);
                  if (candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                  }
                  break;
                }
                case 'LEAVE': {
                  setRemoteStream(null);
                  setIsConnected(false);
                  break;
                }
                default:
                  break;
              }
            } catch (sigErr) {
              console.error('Error handling WebRTC signal:', sigErr);
            }
          });

          // Handle ICE Candidates generated locally
          pc.onicecandidate = (event) => {
            if (event.candidate && client.connected) {
              client.publish({
                destination: `/app/meeting.signal/${roomPublicId}`,
                body: JSON.stringify({
                  roomPublicId,
                  senderPublicId: currentUser?.publicId,
                  type: 'ICE_CANDIDATE',
                  payload: JSON.stringify(event.candidate),
                }),
              });
            }
          };

          // Announce JOIN
          client.publish({
            destination: `/app/meeting.signal/${roomPublicId}`,
            body: JSON.stringify({
              roomPublicId,
              senderPublicId: currentUser?.publicId,
              type: 'JOIN',
              payload: 'Participant joined',
            }),
          });
        },
      });

      client.activate();
      stompClientRef.current = client;

      // Call Join API on meeting service
      await meetingApi.joinMeeting(roomPublicId);
    } catch (err) {
      console.error('Failed to initialize meeting:', err);
      setError(err.message || 'Failed to connect to video consultation');
    }
  }, [roomPublicId, currentUser]);

  useEffect(() => {
    if (roomPublicId && currentUser) {
      initializeCall();
    }

    return () => {
      // Cleanup media tracks and connections
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [roomPublicId, currentUser, initializeCall]);

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error('Failed to toggle screen share:', err);
    }
  };

  const stopScreenShare = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    if (localStreamRef.current && pcRef.current) {
      const originalVideoTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
      if (sender && originalVideoTrack) {
        sender.replaceTrack(originalVideoTrack);
      }
    }
    setIsScreenSharing(false);
  };

  const endCall = async () => {
    try {
      await meetingApi.endMeeting(roomPublicId);
    } catch (err) {
      console.warn('Failed to end room via API:', err);
    }
  };

  return {
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
  };
};
