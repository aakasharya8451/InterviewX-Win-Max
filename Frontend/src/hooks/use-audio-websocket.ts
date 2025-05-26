/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef, useCallback } from "react";
import axios from "axios";
import type { ConnectionStatus, WebSocketRefs } from "@/types/meeting.types";

export function useAudioWebSocket(
  isCallEnded: boolean,
  setConnectionStatus: (status: ConnectionStatus) => void,
  setIsRemoteAudioPlaying: (playing: boolean) => void
) {
  const refs = useRef<WebSocketRefs>({
    audioOutWs: null,
    audioInSocket: null,
    audioCtx: null,
    audioContextIn: null,
    processorIn: null,
    bufferQueue: [],
    isPlaying: false,
    isMicMuted: false,
    reportPolling: null,
    micStream: null,
    currentAudioSource: null,
  });

  const float32ToInt16 = (buffer: Float32Array) => {
    const l = buffer.length;
    const out = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  };

  const playNext = useCallback(() => {
    if (refs.current.bufferQueue.length === 0) {
      refs.current.isPlaying = false;
      refs.current.currentAudioSource = null;
      setIsRemoteAudioPlaying(false);
      return;
    }

    refs.current.isPlaying = true;
    setIsRemoteAudioPlaying(true);

    const buffer = refs.current.bufferQueue.shift()!;
    const src = refs.current.audioCtx!.createBufferSource();
    refs.current.currentAudioSource = src;

    src.buffer = buffer;
    src.connect(refs.current.audioCtx!.destination);
    src.onended = () => playNext();

    try {
      src.start();
    } catch (err) {
      console.error("[Audio] Error starting audio source:", err);
      // If there's an error starting this source, try the next one
      playNext();
    }
  }, [setIsRemoteAudioPlaying]);

  const enqueueBuffer = useCallback(
    (buffer: AudioBuffer) => {
      refs.current.bufferQueue.push(buffer);
      if (!refs.current.isPlaying) playNext();
    },
    [playNext]
  );

  const checkBothConnected = useCallback(() => {
    if (
      refs.current.audioOutWs?.readyState === WebSocket.OPEN &&
      refs.current.audioInSocket?.readyState === WebSocket.OPEN
    ) {
      setConnectionStatus("connected");
    }
  }, [setConnectionStatus]);

  const connectOut = useCallback(() => {
    console.log("[WS-Out] Connecting…");
    setConnectionStatus("connecting");

    refs.current.audioOutWs = new WebSocket(
      "ws://localhost:8000/ws/audio_file"
    );
    refs.current.audioOutWs.binaryType = "arraybuffer";

    refs.current.audioOutWs.addEventListener("open", () => {
      console.log("[WS-Out] Open");
      checkBothConnected();
      if (!refs.current.audioCtx) {
        refs.current.audioCtx = new AudioContext({
          latencyHint: "interactive",
        });
      }
    });

    refs.current.audioOutWs.addEventListener("message", async (evt) => {
      if (typeof evt.data === "string") {
        try {
          const meta = JSON.parse(evt.data);
          console.log("[WS-Out] Meta:", meta);
        } catch (err) {
          console.warn("[WS-Out] Invalid metadata:", err);
        }
        return;
      }

      try {
        const arrayBuffer = evt.data;
        const audioBuffer = await refs.current.audioCtx!.decodeAudioData(
          arrayBuffer
        );
        enqueueBuffer(audioBuffer);
      } catch (err) {
        console.error("[WS-Out] decodeAudioData error", err);
      }
    });

    refs.current.audioOutWs.addEventListener("error", (err) => {
      console.error("[WS-Out] Error", err);
    });

    refs.current.audioOutWs.addEventListener("close", (evt) => {
      console.log("[WS-Out] Closed", evt.code);
      setConnectionStatus("connecting");
    });
  }, [setConnectionStatus, checkBothConnected, enqueueBuffer]);

  const cleanupIn = useCallback(() => {
    if (refs.current.processorIn) {
      try {
        refs.current.processorIn.disconnect();
      } catch (err) {
        console.error("[Audio] Error disconnecting processor:", err);
      }
      refs.current.processorIn = null;
    }

    if (refs.current.audioContextIn) {
      try {
        refs.current.audioContextIn.close();
      } catch (err) {
        console.error("[Audio] Error closing audio context:", err);
      }
      refs.current.audioContextIn = null;
    }
  }, []);

  const startMicCapture = useCallback(() => {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    refs.current.audioContextIn = new AudioContextClass({ sampleRate: 16000 });

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((micStream) => {
        refs.current.micStream = micStream;
        const source =
          refs.current.audioContextIn!.createMediaStreamSource(micStream);
        refs.current.processorIn =
          refs.current.audioContextIn!.createScriptProcessor(4096, 1, 1);
        source.connect(refs.current.processorIn);
        refs.current.processorIn.connect(
          refs.current.audioContextIn!.destination
        );

        refs.current.processorIn.onaudioprocess = (e) => {
          const floatSamples = e.inputBuffer.getChannelData(0);
          const int16 = float32ToInt16(floatSamples);
          if (
            !refs.current.isMicMuted &&
            refs.current.audioInSocket?.readyState === WebSocket.OPEN
          ) {
            refs.current.audioInSocket.send(int16.buffer);
          }
        };
      })
      .catch((err) => console.error("[Mic] Access error", err));
  }, []);

  const initAudioIn = useCallback(() => {
    if (isCallEnded) {
      console.log("[WS-In] Call ended, not connecting");
      return;
    }

    console.log("[WS-In] Connecting mic…");
    refs.current.audioInSocket = new WebSocket(
      "ws://localhost:8000/ws/audio_in"
    );
    refs.current.audioInSocket.binaryType = "arraybuffer";

    refs.current.audioInSocket.addEventListener("open", () => {
      console.log("[WS-In] Open");
      checkBothConnected();
      startMicCapture();
    });

    refs.current.audioInSocket.addEventListener("error", (err) => {
      console.error("[WS-In] Error", err);
      cleanupIn();
    });

    refs.current.audioInSocket.addEventListener("close", (evt) => {
      console.log("[WS-In] Closed with code:", evt.code, "reason:", evt.reason);
      cleanupIn();
      setConnectionStatus("connecting");
    });
  }, [
    isCallEnded,
    setConnectionStatus,
    checkBothConnected,
    startMicCapture,
    cleanupIn,
  ]);

  const toggleMicMute = useCallback((isMuted: boolean) => {
    refs.current.isMicMuted = isMuted;
  }, []);

  // Simplified audio buffer clearing function that works immediately
  const clearAudioBuffer = useCallback(() => {
    console.log("[Audio] Clearing audio buffer immediately...");

    // Stop any currently playing audio
    if (refs.current.currentAudioSource) {
      try {
        refs.current.currentAudioSource.stop();
        refs.current.currentAudioSource.disconnect();
      } catch (err) {
        console.error("[Audio] Error stopping current audio source:", err);
      }
      refs.current.currentAudioSource = null;
    }

    // Clear the buffer queue
    const bufferSize = refs.current.bufferQueue.length;
    refs.current.bufferQueue = [];
    refs.current.isPlaying = false;
    setIsRemoteAudioPlaying(false);

    console.log(`[Audio] Buffer cleared (${bufferSize} items removed)`);

    // Notify backend that buffer is empty - don't wait for this
    axios
      .post("http://localhost:8000/audio-buffer-empty")
      .then(() => console.log("[Audio] Backend notified about empty buffer"))
      .catch((err) =>
        console.error(
          "[Audio] Error notifying backend about empty buffer:",
          err
        )
      );
  }, [setIsRemoteAudioPlaying]);

  const stopMicrophone = useCallback(() => {
    console.log("[Audio] Stopping microphone...");

    // Mute the microphone first
    refs.current.isMicMuted = true;

    // Stop all microphone tracks
    if (refs.current.micStream) {
      refs.current.micStream.getTracks().forEach((track) => {
        try {
          track.stop();
          console.log("[Audio] Stopped microphone track:", track.id);
        } catch (err) {
          console.error("[Audio] Error stopping microphone track:", err);
        }
      });
      refs.current.micStream = null;
    }

    // Disconnect processor
    if (refs.current.processorIn) {
      try {
        refs.current.processorIn.disconnect();
      } catch (err) {
        console.error("[Audio] Error disconnecting processor:", err);
      }
      refs.current.processorIn = null;
    }

    console.log("[Audio] Microphone stopped");
  }, []);

  const cleanup = useCallback(() => {
    // Stop microphone
    stopMicrophone();

    // Close WebSockets
    if (refs.current.audioOutWs) {
      try {
        refs.current.audioOutWs.close();
      } catch (err) {
        console.error("[Audio] Error closing audio output WebSocket:", err);
      }
      refs.current.audioOutWs = null;
    }

    if (refs.current.audioInSocket) {
      try {
        refs.current.audioInSocket.close();
      } catch (err) {
        console.error("[Audio] Error closing audio input WebSocket:", err);
      }
      refs.current.audioInSocket = null;
    }

    // Close audio contexts
    if (refs.current.audioCtx) {
      try {
        refs.current.audioCtx.close();
      } catch (err) {
        console.error("[Audio] Error closing audio context:", err);
      }
      refs.current.audioCtx = null;
    }

    if (refs.current.audioContextIn) {
      try {
        refs.current.audioContextIn.close();
      } catch (err) {
        console.error("[Audio] Error closing audio input context:", err);
      }
      refs.current.audioContextIn = null;
    }

    // Clear any intervals
    if (refs.current.reportPolling) {
      clearInterval(refs.current.reportPolling);
      refs.current.reportPolling = null;
    }

    console.log("[Audio] All audio resources cleaned up");
  }, [stopMicrophone]);

  return {
    refs,
    connectOut,
    initAudioIn,
    toggleMicMute,
    cleanup,
    cleanupIn,
    clearAudioBuffer,
    stopMicrophone,
  };
}
