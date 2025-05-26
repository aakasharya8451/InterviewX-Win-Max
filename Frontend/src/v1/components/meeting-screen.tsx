"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Star,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";

interface MeetingScreenProps {
  stream: MediaStream | null;
  userName: string;
  onEndCall: () => void;
}

export default function MeetingScreen({
  stream,
  userName,
  onEndCall,
}: MeetingScreenProps) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>(
    []
  );
  const [audioOutputDevices, setAudioOutputDevices] = useState<
    MediaDeviceInfo[]
  >([]);
  const [selectedAudioInputId, setSelectedAudioInputId] = useState<string>("");
  const [selectedAudioOutputId, setSelectedAudioOutputId] =
    useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [isRemoteAudioPlaying, setIsRemoteAudioPlaying] = useState(false);
  const [isCallEnded, setIsCallEnded] = useState(false);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportRating, setReportRating] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [remoteName, setRemoteName] = useState("Alex Johnson");
  const remoteInitials = remoteName
    .split(" ")
    .map((name) => name[0])
    .join("");
  const userInitials = userName.charAt(0).toUpperCase();

  // WebSocket refs - matching original variable names
  const audioOutWsRef = useRef<WebSocket | null>(null);
  const audioInSocketRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const processorInRef = useRef<ScriptProcessorNode | null>(null);
  const bufferQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const isMicMutedRef = useRef(false);
  const reportPollingRef = useRef<NodeJS.Timeout | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const RETRY_DELAY_MS = 1000;

  // setRemoteName("AI Interviewer") // Set remote name for demo purposes
  useEffect(() => {
    setRemoteName("AI Interviewer");
  }, []);

  // Connect output WebSocket - exact logic from original (always reconnects)
  const connectOut = () => {
    console.log("[WS-Out] Connecting…");
    setConnectionStatus("connecting");

    audioOutWsRef.current = new WebSocket("ws://localhost:8000/ws/audio_file");
    audioOutWsRef.current.binaryType = "arraybuffer";

    audioOutWsRef.current.addEventListener("open", () => {
      console.log("[WS-Out] Open");
      checkBothConnected();
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext({ latencyHint: "interactive" });
      }
    });

    audioOutWsRef.current.addEventListener("message", async (evt) => {
      if (typeof evt.data === "string") {
        // parse metadata frame
        try {
          const meta = JSON.parse(evt.data);
          console.log("[WS-Out] Meta:", meta);
          // you could use meta.sample_rate, meta.channels if needed
        } catch (err) {
          console.warn("[WS-Out] Invalid metadata:", err);
        }
        return;
      }

      // handle WAV file chunks
      try {
        const arrayBuffer = evt.data;
        const audioBuffer = await audioCtxRef.current!.decodeAudioData(
          arrayBuffer
        );
        enqueueBuffer(audioBuffer);
      } catch (err) {
        console.error("[WS-Out] decodeAudioData error", err);
      }
    });

    audioOutWsRef.current.addEventListener("error", (err) => {
      console.error("[WS-Out] Error", err);
    });

    audioOutWsRef.current.addEventListener("close", (evt) => {
      console.log("[WS-Out] Closed", evt.code);
      setConnectionStatus("connecting");
      // Always reconnect audio_file
      setTimeout(connectOut, RETRY_DELAY_MS);
    });
  };

  const enqueueBuffer = (buffer: AudioBuffer) => {
    bufferQueueRef.current.push(buffer);
    if (!isPlayingRef.current) playNext();
  };

  const playNext = () => {
    if (bufferQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsRemoteAudioPlaying(false);
      return;
    }
    isPlayingRef.current = true;
    setIsRemoteAudioPlaying(true);
    const buffer = bufferQueueRef.current.shift()!;
    const src = audioCtxRef.current!.createBufferSource();
    src.buffer = buffer;
    src.connect(audioCtxRef.current!.destination);
    src.onended = () => playNext();
    src.start();
  };

  // Initialize audio input WebSocket - only connects if call is not ended
  const initAudioIn = () => {
    // Don't initialize if call has ended
    if (isCallEnded) {
      console.log("[WS-In] Call ended, not connecting");
      return;
    }

    console.log("[WS-In] Connecting mic…");
    audioInSocketRef.current = new WebSocket("ws://localhost:8000/ws/audio_in");
    audioInSocketRef.current.binaryType = "arraybuffer";

    audioInSocketRef.current.addEventListener("open", () => {
      console.log("[WS-In] Open");
      checkBothConnected();
      startMicCapture();
    });

    audioInSocketRef.current.addEventListener("error", (err) => {
      console.error("[WS-In] Error", err);
      cleanupIn();
    });

    audioInSocketRef.current.addEventListener("close", (evt) => {
      console.log("[WS-In] Closed with code:", evt.code, "reason:", evt.reason);
      cleanupIn();

      // Only reconnect if call is not ended
      if (!isCallEnded) {
        console.log("[WS-In] Will reconnect in", RETRY_DELAY_MS, "ms");
        setConnectionStatus("connecting");
        setTimeout(initAudioIn, RETRY_DELAY_MS);
      } else {
        console.log("[WS-In] Call ended, not reconnecting");
      }
    });
  };

  const checkBothConnected = () => {
    if (
      audioOutWsRef.current?.readyState === WebSocket.OPEN &&
      audioInSocketRef.current?.readyState === WebSocket.OPEN
    ) {
      setConnectionStatus("connected");
    }
  };

  // Start microphone capture - exact logic from original
  const startMicCapture = () => {
    // Use fallback for webkit browsers like original
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    audioContextInRef.current = new AudioContextClass({ sampleRate: 16000 });

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((micStream) => {
        micStreamRef.current = micStream;
        const source =
          audioContextInRef.current!.createMediaStreamSource(micStream);
        processorInRef.current =
          audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
        source.connect(processorInRef.current);
        processorInRef.current.connect(audioContextInRef.current!.destination);

        processorInRef.current.onaudioprocess = (e) => {
          const floatSamples = e.inputBuffer.getChannelData(0);
          const int16 = float32ToInt16(floatSamples);
          // Only send if not muted and socket is open
          if (
            !isMicMutedRef.current &&
            audioInSocketRef.current?.readyState === WebSocket.OPEN
          ) {
            audioInSocketRef.current.send(int16.buffer);
          }
        };
      })
      .catch((err) => console.error("[Mic] Access error", err));
  };

  // Exact conversion logic from original
  const float32ToInt16 = (buffer: Float32Array) => {
    const l = buffer.length;
    const out = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  };

  // Updated cleanup logic
  const cleanupIn = () => {
    if (processorInRef.current) processorInRef.current.disconnect();
    if (audioContextInRef.current) audioContextInRef.current.close();
    processorInRef.current = null;
    audioContextInRef.current = null;
  };

  // Revoke microphone permissions
  const revokeMicPermissions = () => {
    console.log("Revoking microphone permissions...");

    // Stop the dedicated mic stream tracks
    if (micStreamRef.current) {
      console.log(
        "Stopping micStreamRef tracks:",
        micStreamRef.current.getTracks().length
      );
      micStreamRef.current.getTracks().forEach((track) => {
        console.log("Stopping track:", track.kind, track.id);
        track.stop();
      });
      micStreamRef.current = null;
    }

    // Stop audio tracks from the main stream
    if (stream) {
      console.log(
        "Stopping main stream audio tracks:",
        stream.getAudioTracks().length
      );
      stream.getAudioTracks().forEach((track) => {
        console.log("Stopping track:", track.kind, track.id);
        track.stop();
      });
    }

    // Ensure the audio context is closed
    if (audioContextInRef.current) {
      audioContextInRef.current
        .close()
        .catch((err) => console.error("Error closing audio context:", err));
      audioContextInRef.current = null;
    }

    // Ensure processor is disconnected
    if (processorInRef.current) {
      try {
        processorInRef.current.disconnect();
      } catch (err) {
        console.error("Error disconnecting processor:", err);
      }
      processorInRef.current = null;
    }

    console.log("All microphone permissions revoked");
  };

  // Poll for report data
  const pollForReport = () => {
    setIsLoadingReport(true);
    reportPollingRef.current = setInterval(async () => {
      try {
        const response = await axios.post("http://localhost:8000/report");
        if (
          response.data &&
          response.data.number &&
          typeof response.data.number === "number" &&
          response.data.number >= 1 &&
          response.data.number <= 3
        ) {
          setReportRating(response.data.number);
          setIsLoadingReport(false);
          if (reportPollingRef.current) {
            clearInterval(reportPollingRef.current);
            reportPollingRef.current = null;
          }
        }
      } catch (error) {
        console.error("Error polling for report:", error);
      }
    }, 1000);
  };

  // Initialize WebSocket connections when component mounts
  useEffect(() => {
    connectOut();
    initAudioIn();

    return () => {
      // Cleanup on unmount
      if (audioOutWsRef.current) audioOutWsRef.current.close();
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (reportPollingRef.current) clearInterval(reportPollingRef.current);
      cleanupIn();
      revokeMicPermissions();
    };
  }, []);

  // Get available media devices
  useEffect(() => {
    async function getDevices() {
      try {
        if (!stream) {
          await navigator.mediaDevices
            .getUserMedia({ audio: true, video: true })
            .catch(() =>
              console.log(
                "Permission denied, but continuing to enumerate devices"
              )
            );
        }

        const devices = await navigator.mediaDevices.enumerateDevices();

        const audioInputs = devices.filter(
          (device) => device.kind === "audioinput"
        );
        const audioOutputs = devices.filter(
          (device) => device.kind === "audiooutput"
        );

        setAudioInputDevices(audioInputs);
        setAudioOutputDevices(audioOutputs);

        if (audioInputs.length > 0 && !selectedAudioInputId) {
          setSelectedAudioInputId(audioInputs[0].deviceId);
        }

        if (audioOutputs.length > 0 && !selectedAudioOutputId) {
          setSelectedAudioOutputId(audioOutputs[0].deviceId);
        }
      } catch (error) {
        console.error("Error getting media devices:", error);
      }
    }

    getDevices();
    navigator.mediaDevices.addEventListener("devicechange", getDevices);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", getDevices);
    };
  }, [stream, selectedAudioInputId, selectedAudioOutputId]);

  const switchAudioInput = async (deviceId: string) => {
    try {
      if (!stream) return;

      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
        video: isVideoEnabled ? {} : false,
      });

      const audioTrack = newStream.getAudioTracks()[0];
      const oldAudioTrack = stream.getAudioTracks()[0];

      if (oldAudioTrack) {
        stream.removeTrack(oldAudioTrack);
        oldAudioTrack.stop();
      }

      if (audioTrack) {
        stream.addTrack(audioTrack);
        audioTrack.enabled = isAudioEnabled;
      }

      setSelectedAudioInputId(deviceId);
    } catch (error) {
      console.error("Error switching audio input:", error);
    }
  };

  const switchAudioOutput = async (deviceId: string) => {
    try {
      if (videoRef.current && "setSinkId" in videoRef.current) {
        await (videoRef.current as any).setSinkId(deviceId);
        setSelectedAudioOutputId(deviceId);
      }
    } catch (error) {
      console.error("Error switching audio output:", error);
    }
  };

  useEffect(() => {
    if (videoRef.current && stream && isVideoEnabled) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isVideoEnabled]);

  const toggleAudio = () => {
    // Toggle both camera stream audio and WebSocket audio
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioEnabled;
      });
    }
    // Update WebSocket mic mute state
    isMicMutedRef.current = isAudioEnabled;
    setIsAudioEnabled(!isAudioEnabled);
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
    }
    setIsVideoEnabled(!isVideoEnabled);
  };

  // Floating window control functions
  const toggleFloatingAudio = () => {
    toggleAudio();
  };

  const toggleFloatingVideo = () => {
    toggleVideo();
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-orange-500";
      case "disconnected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleEndCall = async () => {
    console.log("Ending call...");

    // Set call as ended to prevent audio_in reconnection
    setIsCallEnded(true);

    // Ensure we stop all audio processing first
    if (processorInRef.current) {
      try {
        processorInRef.current.disconnect();
      } catch (err) {
        console.error("Error disconnecting processor:", err);
      }
      processorInRef.current = null;
    }

    // Close audio context before closing socket
    if (audioContextInRef.current) {
      try {
        await audioContextInRef.current.close();
      } catch (err) {
        console.error("Error closing audio context:", err);
      }
      audioContextInRef.current = null;
    }

    // Disconnect audio_in socket permanently
    if (audioInSocketRef.current) {
      console.log(
        "Closing audio_in socket:",
        audioInSocketRef.current.readyState
      );
      audioInSocketRef.current.close(1000, "Call ended by user");
      audioInSocketRef.current = null;
    }

    // Revoke microphone permissions
    revokeMicPermissions();

    // Send POST request to end-call endpoint using axios
    try {
      const response = await axios.post(
        "http://localhost:8000/end-call",
        {
          status: 1,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Call ended successfully:", response.data);
    } catch (error) {
      console.error("Error ending call:", error);
    }

    // Show feedback overlay and start polling for report
    setShowFeedbackOverlay(true);
    pollForReport();
  };

  const handleExitCall = () => {
    // Clean up polling
    if (reportPollingRef.current) {
      clearInterval(reportPollingRef.current);
      reportPollingRef.current = null;
    }

    // Call the original onEndCall prop
    onEndCall();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 3 }, (_, index) => (
      <Star
        key={index}
        className={`w-8 h-8 ${
          index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
        }`}
      />
    ));
  };

  // Monitor call ended state
  useEffect(() => {
    if (isCallEnded) {
      console.log("Call ended state detected, cleaning up audio_in resources");

      // Ensure audio_in socket is closed
      if (audioInSocketRef.current) {
        audioInSocketRef.current.close(1000, "Call ended by user");
        audioInSocketRef.current = null;
      }

      // Clean up audio processing
      cleanupIn();

      // Revoke mic permissions
      revokeMicPermissions();
    }
  }, [isCallEnded]);

  return (
    <div className="w-full h-screen flex flex-col relative bg-gradient-to-br from-[#0a0f1c] via-[#0f1624] to-[#1a1f2e] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      {/* Main meeting area */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-4xl md:max-w-6xl h-[70vh] md:h-[75vh] relative">
          {/* Main participant view */}
          <div className="w-full h-full bg-gradient-to-br from-[#1e2a3a] to-[#2a3441] rounded-2xl shadow-2xl border border-white/10 backdrop-blur-sm overflow-hidden relative group">
            {/* Ambient glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50"></div>

            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {/* Participant content */}
              <div className="text-center z-10">
                <div className="relative mb-6">
                  <Avatar
                    className={`w-24 h-24 md:w-40 md:h-40 mx-auto bg-gradient-to-br from-blue-500 to-blue-700 shadow-2xl ring-4 ring-white/20 transition-all duration-300 ${
                      isRemoteAudioPlaying ? "scale-110 ring-8" : ""
                    }`}
                  >
                    <AvatarFallback className="text-3xl md:text-5xl font-semibold text-white">
                      {remoteInitials}
                    </AvatarFallback>
                  </Avatar>
                  {/* Audio indicator */}
                  <div
                    className={`absolute -bottom-2 -right-2 w-6 h-6 md:w-8 md:h-8 ${getConnectionColor()} rounded-full flex items-center justify-center shadow-lg`}
                  >
                    <div
                      className={`w-2 h-2 md:w-3 md:h-3 bg-white rounded-full ${
                        isRemoteAudioPlaying ? "animate-pulse" : ""
                      }`}
                    ></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="inline-flex items-center gap-3 px-4 py-2 md:px-6 md:py-3 bg-black/40 backdrop-blur-sm rounded-full border border-white/20">
                    <span className="text-lg md:text-xl font-medium text-white">
                      {remoteName}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm">
                    <div
                      className={`w-2 h-2 ${getConnectionColor()} rounded-full animate-pulse`}
                    ></div>
                    <span
                      className={`font-medium ${
                        connectionStatus === "connected"
                          ? "text-green-400"
                          : connectionStatus === "connecting"
                          ? "text-orange-400"
                          : "text-red-400"
                      }`}
                    >
                      {connectionStatus === "connected"
                        ? "Connected"
                        : connectionStatus === "connecting"
                        ? "Connecting..."
                        : "Disconnected"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-4 left-4 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
              <div className="absolute bottom-4 right-4 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-pink-400/20 to-red-400/20 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Control bar */}
      <div className="py-4 md:py-6 flex justify-center">
        <div className="flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
          {/* End call button */}
          <Button
            variant="destructive"
            size="icon"
            className="rounded-full h-12 w-12 md:h-14 md:w-14 bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-red-500/25 transition-all duration-200 hover:scale-105"
            onClick={handleEndCall}
          >
            <PhoneOff className="h-5 w-5 md:h-6 md:w-6" />
          </Button>

          {/* Audio button */}
          <Button
            variant="secondary"
            size="icon"
            className={`rounded-full h-10 w-10 md:h-12 md:w-12 transition-all duration-200 hover:scale-105 shadow-lg ${
              isAudioEnabled
                ? "bg-gray-700/80 hover:bg-gray-600/80 text-white"
                : "bg-red-500/80 hover:bg-red-600/80 text-white"
            }`}
            onClick={toggleAudio}
          >
            {isAudioEnabled ? (
              <Mic className="h-4 w-4 md:h-5 md:w-5" />
            ) : (
              <MicOff className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </Button>

          {/* Video button */}
          <Button
            variant="secondary"
            size="icon"
            className={`rounded-full h-10 w-10 md:h-12 md:w-12 transition-all duration-200 hover:scale-105 shadow-lg ${
              isVideoEnabled
                ? "bg-gray-700/80 hover:bg-gray-600/80 text-white"
                : "bg-red-500/80 hover:bg-red-600/80 text-white"
            }`}
            onClick={toggleVideo}
          >
            {isVideoEnabled ? (
              <Video className="h-4 w-4 md:h-5 md:w-5" />
            ) : (
              <VideoOff className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </Button>

          {/* Settings button */}
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full h-10 w-10 md:h-12 md:w-12 bg-gray-700/80 hover:bg-gray-600/80 text-white transition-all duration-200 hover:scale-105 shadow-lg"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>

      {/* Enhanced Self view */}
      <div className="absolute bottom-16 right-4 md:bottom-24 md:right-6 w-[160px] h-[100px] md:w-[220px] md:h-[140px] group">
        <div className="w-full h-full bg-gradient-to-br from-[#1e2a3a] to-[#2a3441] rounded-xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm relative transition-all duration-300 hover:scale-105">
          {isVideoEnabled && stream ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-500/20 to-green-700/20">
              <Avatar className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-green-700 shadow-lg">
                <AvatarFallback className="text-xl font-semibold text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-white">
                  {userName}
                </span>
              </div>
            </div>
          )}

          {/* Self view controls overlay - Fixed functionality */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className={`h-8 w-8 p-0 text-white hover:bg-white/20 ${
                  !isVideoEnabled ? "bg-red-500/80" : ""
                }`}
                onClick={toggleFloatingVideo}
              >
                {isVideoEnabled ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <VideoOff className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={`h-8 w-8 p-0 text-white hover:bg-white/20 ${
                  !isAudioEnabled ? "bg-red-500/80" : ""
                }`}
                onClick={toggleFloatingAudio}
              >
                {isAudioEnabled ? (
                  <Mic className="h-4 w-4" />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Status indicator */}
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <div
              className={`w-2 h-2 ${
                isAudioEnabled ? "bg-green-400" : "bg-red-400"
              } rounded-full animate-pulse`}
            ></div>
            <span className="text-xs text-white/80 font-medium">You</span>
          </div>
        </div>
      </div>

      {/* Feedback Overlay */}
      {showFeedbackOverlay && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-[#1e2a3a] to-[#2a3441] rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20 shadow-2xl">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-6">
                Preparing Feedback
              </h2>

              {isLoadingReport ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-300">
                    Please wait till the report is available...
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-center gap-2">
                    {renderStars(reportRating || 0)}
                  </div>
                  <p className="text-gray-300">
                    Your interview rating: {reportRating}/3
                  </p>
                </div>
              )}

              <Button
                onClick={handleExitCall}
                className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Exit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-sm md:max-w-md bg-[#1a2235]/95 backdrop-blur-xl border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-sm font-medium mb-3 text-white">
                Audio Input
              </h3>
              {audioInputDevices.length > 0 ? (
                <select
                  className="w-full p-3 rounded-lg border border-white/20 bg-[#2a3441] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedAudioInputId}
                  onChange={(e) => switchAudioInput(e.target.value)}
                >
                  {audioInputDevices.map((device) => (
                    <option
                      key={device.deviceId}
                      value={device.deviceId}
                      className="bg-[#2a3441]"
                    >
                      {device.label ||
                        `Microphone ${audioInputDevices.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-400">No microphones detected</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3 text-white">
                Audio Output
              </h3>
              {audioOutputDevices.length > 0 ? (
                <select
                  className="w-full p-3 rounded-lg border border-white/20 bg-[#2a3441] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedAudioOutputId}
                  onChange={(e) => switchAudioOutput(e.target.value)}
                >
                  {audioOutputDevices.map((device) => (
                    <option
                      key={device.deviceId}
                      value={device.deviceId}
                      className="bg-[#2a3441]"
                    >
                      {device.label ||
                        `Speaker ${audioOutputDevices.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-400">No speakers detected</p>
              )}
              {audioOutputDevices.length > 0 &&
                !("setSinkId" in HTMLMediaElement.prototype) && (
                  <p className="text-xs text-yellow-400 mt-2">
                    Note: Your browser may not support changing audio output
                    devices
                  </p>
                )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
