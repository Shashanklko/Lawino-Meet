import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useLocalMeetingRecorder
 * 
 * In-browser local recording system:
 * - Mixes local audio + all remote participant audio via Web Audio API AudioContext.
 * - Composites all active video streams onto an internal 1280x720 30FPS canvas.
 * - Compiles video using browser MediaRecorder API (VP9/VP8/WebM/MP4).
 * - Saves directly to the user's local disk or phone Downloads folder.
 * - 100% Client-side: Zero bytes uploaded to external servers, ensuring statutory privilege.
 */
export const useLocalMeetingRecorder = ({ roomPublicId, localStream, participants = [] }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [savedFileInfo, setSavedFileInfo] = useState(null);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioDestinationRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Format seconds to HH:MM:SS
  const formatTime = (secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Start Local In-Browser Recording
   */
  const startRecording = useCallback(() => {
    try {
      recordedChunksRef.current = [];
      setSavedFileInfo(null);

      // 1. Setup Canvas Compositor (1280x720 @ 30fps)
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      canvasRef.current = canvas;
      const ctx = canvas.getContext('2d');

      // 2. Setup Web Audio API to mix all participant audio
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const audioDestination = audioCtx.createMediaStreamDestination();
      audioDestinationRef.current = audioDestination;

      // Connect local microphone audio
      if (localStream && localStream.getAudioTracks().length > 0) {
        try {
          const localSource = audioCtx.createMediaStreamSource(localStream);
          localSource.connect(audioDestination);
        } catch (e) {
          console.warn('Could not connect local audio to recorder:', e);
        }
      }

      // Connect all remote participants' audio
      participants.forEach((p) => {
        if (p.stream && p.stream.getAudioTracks().length > 0) {
          try {
            const remoteSource = audioCtx.createMediaStreamSource(p.stream);
            remoteSource.connect(audioDestination);
          } catch (e) {
            console.warn(`Could not connect participant ${p.name} audio to recorder:`, e);
          }
        }
      });

      // 3. Render loop to composite video streams onto canvas
      const render = () => {
        if (!canvasRef.current) return;
        const width = 1280;
        const height = 720;

        // Background
        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(0, 0, width, height);

        // Gather all participant video sources to draw
        const sources = [];

        // Local video
        if (localStream && localStream.getVideoTracks().some((t) => t.enabled)) {
          const localVideoEl = document.getElementById('local-video-feed');
          sources.push({
            el: localVideoEl,
            name: 'You (Host / Client)',
            isMuted: !localStream.getAudioTracks().some((t) => t.enabled),
          });
        } else {
          sources.push({
            el: null,
            name: 'You',
            isMuted: true,
          });
        }

        // Remote participant videos
        participants.forEach((p) => {
          const remoteEl = document.getElementById(`remote-video-${p.id}`);
          sources.push({
            el: remoteEl,
            name: p.name || 'Participant',
            isMuted: p.isMuted,
          });
        });

        const count = sources.length;
        let cols = 1;
        let rows = 1;

        if (count === 2) {
          cols = 2;
          rows = 1;
        } else if (count >= 3 && count <= 4) {
          cols = 2;
          rows = 2;
        } else if (count >= 5) {
          cols = 3;
          rows = 2;
        }

        const cellW = width / cols;
        const cellH = height / rows;

        sources.forEach((src, idx) => {
          const c = idx % cols;
          const r = Math.floor(idx / cols);
          const x = c * cellW;
          const y = r * cellH;

          // Draw tile border / background
          ctx.fillStyle = '#111726';
          ctx.fillRect(x + 4, y + 4, cellW - 8, cellH - 8);

          // Draw video frame if video element is ready
          if (src.el && src.el.readyState >= 2) {
            try {
              ctx.drawImage(src.el, x + 4, y + 4, cellW - 8, cellH - 8);
            } catch (err) {
              // fallback if frame cannot be grabbed
            }
          } else {
            // Camera Off Avatar placeholder
            ctx.fillStyle = '#1e2638';
            ctx.beginPath();
            ctx.arc(x + cellW / 2, y + cellH / 2 - 15, Math.min(cellW, cellH) * 0.18, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FAF6EE';
            ctx.font = 'bold 24px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(src.name ? src.name.charAt(0).toUpperCase() : 'P', x + cellW / 2, y + cellH / 2 - 15);
          }

          // Draw name overlay tag
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          ctx.fillRect(x + 12, y + cellH - 36, cellW - 24, 24);

          ctx.fillStyle = '#ffffff';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(src.name + (src.isMuted ? ' 🔇' : ''), x + 20, y + cellH - 24);
        });

        // Top watermark & recording badge
        ctx.fillStyle = 'rgba(12, 35, 64, 0.85)';
        ctx.fillRect(0, 0, width, 36);

        ctx.fillStyle = '#E5A952';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('LAWINOMEET • CONFIDENTIAL LEGAL CONSULTATION (STATUTORY RECORDING)', 16, 18);

        // Real-time timestamp watermark
        ctx.fillStyle = '#A0AEC0';
        ctx.font = '11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(new Date().toLocaleString('en-IN'), width - 16, 18);

        // Red recording indicator badge
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(width - 240, 18, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('REC LOCAL ONLY', width - 230, 18);

        animationFrameRef.current = requestAnimationFrame(render);
      };

      render();

      // 4. Create MediaStream from Canvas and mixed Audio
      const canvasStream = canvas.captureStream(30);
      const audioTrack = audioDestination.stream.getAudioTracks()[0];

      const combinedTracks = [...canvasStream.getVideoTracks()];
      if (audioTrack) {
        combinedTracks.push(audioTrack);
      }

      const combinedStream = new MediaStream(combinedTracks);

      // 5. Initialize MediaRecorder with optimal format
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];
      const selectedMime = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMime || undefined,
        videoBitsPerSecond: 2500000,
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const chunks = recordedChunksRef.current;
        if (chunks.length === 0) return;

        const blobType = selectedMime || 'video/webm';
        const recordedBlob = new Blob(chunks, { type: blobType });

        // Generate download filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const ext = blobType.includes('mp4') ? 'mp4' : 'webm';
        const fileName = `LawinoMeet-Recording-${roomPublicId || 'Room'}-${timestamp}.${ext}`;

        // Trigger automatic local download directly to disk or phone Downloads folder
        const downloadUrl = URL.createObjectURL(recordedBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        const sizeInMb = (recordedBlob.size / (1024 * 1024)).toFixed(2);
        setSavedFileInfo({
          fileName,
          sizeMb: sizeInMb,
          savedAt: new Date().toLocaleTimeString(),
          blobUrl: downloadUrl,
        });

        setTimeout(() => {
          document.body.removeChild(a);
        }, 1500);
      };

      recorder.start(1000); // 1-second chunks
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);

      // Start duration counter
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start in-browser local recording:', err);
      alert('Could not start recording. Please ensure camera/mic permissions are granted: ' + err.message);
    }
  }, [localStream, participants, roomPublicId]);

  /**
   * Pause Recording
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  }, []);

  /**
   * Resume Recording
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
  }, []);

  /**
   * Stop Recording and trigger download to local device / phone downloads folder
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  return {
    isRecording,
    isPaused,
    recordingDuration,
    formatTime,
    savedFileInfo,
    clearSavedNotification: () => setSavedFileInfo(null),
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  };
};
