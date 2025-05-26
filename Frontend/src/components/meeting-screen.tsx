"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import axios from "axios";

import type { MeetingScreenProps, MeetingState } from "@/types/meeting.types";
import { useAudioWebSocket } from "@/hooks/use-audio-websocket";
import { useMediaDevices } from "@/hooks/use-media-devices";
import { useReportPolling } from "@/hooks/use-report-polling";
import { MeetingControls } from "@/components/components/meeting-controls";
import { FeedbackOverlay } from "@/components/components/feedback-overlay";
import { ConnectionStatusIndicator } from "@/components/components/connection-status";

export default function MeetingScreen({
  stream,
  userName,
  onEndCall,
}: MeetingScreenProps) {
  const [state, setState] = useState<MeetingState>({
    isAudioEnabled: true,
    isVideoEnabled: true,
    isSettingsOpen: false,
    connectionStatus: "connecting",
    isRemoteAudioPlaying: false,
    isCallEnded: false,
    showFeedbackOverlay: false,
    isLoadingReport: false,
    reportRating: null,
    isEndingCall: false,
    isExiting: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const [remoteName, setRemoteName] = useState("AI Interviewer");
  const remoteInitials = remoteName
    .split(" ")
    .map((name) => name[0])
    .join("");
  const userInitials = userName.charAt(0).toUpperCase();

  const {
    connectOut,
    initAudioIn,
    toggleMicMute,
    cleanup,
    cleanupIn,
    clearAudioBuffer,
    stopMicrophone,
  } = useAudioWebSocket(
    state.isCallEnded,
    (status) => setState((prev) => ({ ...prev, connectionStatus: status })),
    (playing) =>
      setState((prev) => ({ ...prev, isRemoteAudioPlaying: playing }))
  );

  const {
    audioInputDevices,
    audioOutputDevices,
    selectedAudioInputId,
    selectedAudioOutputId,
    switchAudioInput,
    switchAudioOutput,
  } = useMediaDevices(stream);

  const { startReportPolling, stopReportPolling } = useReportPolling(
    (rating) => setState((prev) => ({ ...prev, reportRating: rating })),
    (loading) => setState((prev) => ({ ...prev, isLoadingReport: loading }))
  );

  useEffect(() => {
    setRemoteName("AI Interviewer");
  }, []);

  useEffect(() => {
    console.log("Initializing connections on mount");
    connectOut();
    initAudioIn();

    return () => {
      console.log("Cleaning up connections on unmount");
      cleanup();
      stopReportPolling();
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream && state.isVideoEnabled) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, state.isVideoEnabled]);

  useEffect(() => {
    if (state.isCallEnded) {
      console.log("Call ended state detected, cleaning up audio_in resources");
      cleanupIn();
    }
  }, [state.isCallEnded, cleanupIn]);

  const revokeMicPermissions = () => {
    console.log("Revoking microphone permissions...");

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

    console.log("All microphone permissions revoked");
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !state.isAudioEnabled;
      });
    }
    toggleMicMute(state.isAudioEnabled);
    setState((prev) => ({ ...prev, isAudioEnabled: !prev.isAudioEnabled }));
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !state.isVideoEnabled;
      });
    }
    setState((prev) => ({ ...prev, isVideoEnabled: !prev.isVideoEnabled }));
  };

  const handleEndCall = async () => {
    // Prevent multiple clicks
    if (state.isEndingCall || state.isCallEnded) return;

    // Set ending call state to prevent multiple clicks
    setState((prev) => ({ ...prev, isEndingCall: true }));

    console.log("Ending call...");

    try {
      // 1. Stop the microphone immediately
      stopMicrophone();

      // 2. Clear the audio buffer (non-blocking)
      clearAudioBuffer();

      // 3. Revoke microphone permissions
      revokeMicPermissions();

      // 4. Send the end-call request
      const response = await axios.post(
        "http://localhost:8000/end-call",
        { status: 1 },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("Call ended successfully:", response.data);

      // 5. Update state to show feedback overlay and mark call as ended
      setState((prev) => ({
        ...prev,
        isCallEnded: true,
        showFeedbackOverlay: true,
        isEndingCall: false,
      }));

      // 6. Start the report polling process
      startReportPolling();
    } catch (error) {
      console.error("Error ending call:", error);
      // Reset the ending state on error
      setState((prev) => ({ ...prev, isEndingCall: false }));
    }
  };

  const handleExitCall = async () => {
    // Prevent multiple clicks
    if (state.isExiting) return;

    // Set exiting state to prevent multiple clicks
    setState((prev) => ({ ...prev, isExiting: true }));

    try {
      // 1. Clear the audio buffer (non-blocking)
      clearAudioBuffer();

      // 2. Send the end-session request
      axios
        .post(
          "http://localhost:8000/end-session",
          { status: 1 },
          { headers: { "Content-Type": "application/json" } }
        )
        .then(() => console.log("Session ended successfully"))
        .catch((err) => console.error("Error ending session:", err));
    } finally {
      // 3. Clean up resources regardless of API call success
      stopReportPolling();

      // 4. Call the onEndCall callback to exit
      onEndCall();
    }
  };

  const getConnectionColor = () => {
    return state.connectionStatus === "connected"
      ? "bg-green-500"
      : "bg-orange-500";
  };

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
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50"></div>

            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <div className="text-center z-10">
                <div className="relative mb-6">
                  <Avatar
                    className={`w-24 h-24 md:w-40 md:h-40 mx-auto bg-gradient-to-br from-blue-500 to-blue-700 shadow-2xl ring-4 ring-white/20 transition-all duration-300 ${
                      state.isRemoteAudioPlaying ? "scale-110 ring-8" : ""
                    }`}
                  >
                    <AvatarFallback className="text-3xl md:text-5xl font-semibold text-white">
                      {remoteInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-2 -right-2 w-6 h-6 md:w-8 md:h-8 ${getConnectionColor()} rounded-full flex items-center justify-center shadow-lg`}
                  >
                    <div
                      className={`w-2 h-2 md:w-3 md:h-3 bg-white rounded-full ${
                        state.isRemoteAudioPlaying ? "animate-pulse" : ""
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

                  <ConnectionStatusIndicator status={state.connectionStatus} />
                </div>
              </div>

              <div className="absolute top-4 left-4 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
              <div className="absolute bottom-4 right-4 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-pink-400/20 to-red-400/20 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <MeetingControls
        isAudioEnabled={state.isAudioEnabled}
        isVideoEnabled={state.isVideoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onEndCall={handleEndCall}
        onOpenSettings={() =>
          setState((prev) => ({ ...prev, isSettingsOpen: true }))
        }
        isEndingCall={state.isEndingCall}
        isCallEnded={state.isCallEnded}
      />

      {/* Self view */}
      <div className="absolute bottom-16 right-4 md:bottom-24 md:right-6 w-[160px] h-[100px] md:w-[220px] md:h-[140px] group">
        <div className="w-full h-full bg-gradient-to-br from-[#1e2a3a] to-[#2a3441] rounded-xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm relative transition-all duration-300 hover:scale-105">
          {state.isVideoEnabled && stream ? (
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

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className={`h-8 w-8 p-0 text-white hover:bg-white/20 ${
                  !state.isVideoEnabled ? "bg-red-500/80" : ""
                }`}
                onClick={toggleVideo}
              >
                {state.isVideoEnabled ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <VideoOff className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={`h-8 w-8 p-0 text-white hover:bg-white/20 ${
                  !state.isAudioEnabled ? "bg-red-500/80" : ""
                }`}
                onClick={toggleAudio}
              >
                {state.isAudioEnabled ? (
                  <Mic className="h-4 w-4" />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="absolute top-2 left-2 flex items-center gap-1">
            <div
              className={`w-2 h-2 ${
                state.isAudioEnabled ? "bg-green-400" : "bg-red-400"
              } rounded-full animate-pulse`}
            ></div>
            <span className="text-xs text-white/80 font-medium">You</span>
          </div>
        </div>
      </div>

      {/* Feedback Overlay */}
      <FeedbackOverlay
        isVisible={state.showFeedbackOverlay}
        isLoadingReport={state.isLoadingReport}
        reportRating={state.reportRating}
        onExit={handleExitCall}
        isExiting={state.isExiting}
      />

      {/* Settings Dialog */}
      <Dialog
        open={state.isSettingsOpen}
        onOpenChange={(open) =>
          setState((prev) => ({ ...prev, isSettingsOpen: open }))
        }
      >
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
                  onChange={(e) =>
                    switchAudioInput(
                      e.target.value,
                      stream,
                      state.isVideoEnabled,
                      state.isAudioEnabled
                    )
                  }
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
                  onChange={(e) =>
                    switchAudioOutput(e.target.value, videoRef.current)
                  }
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
