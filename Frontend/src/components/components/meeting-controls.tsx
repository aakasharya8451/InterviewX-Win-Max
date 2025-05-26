"use client";

import { Button } from "@/components/ui/button";
import {
  Settings,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Loader2,
} from "lucide-react";

interface MeetingControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onOpenSettings: () => void;
  isEndingCall: boolean;
  isCallEnded: boolean;
}

export function MeetingControls({
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  onOpenSettings,
  isEndingCall,
  isCallEnded,
}: MeetingControlsProps) {
  return (
    <div className="py-4 md:py-6 flex justify-center">
      <div className="flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
        <Button
          variant="destructive"
          size="icon"
          className="rounded-full h-12 w-12 md:h-14 md:w-14 bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-red-500/25 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          onClick={onEndCall}
          disabled={isEndingCall || isCallEnded}
        >
          {isEndingCall ? (
            <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
          ) : (
            <PhoneOff className="h-5 w-5 md:h-6 md:w-6" />
          )}
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className={`rounded-full h-10 w-10 md:h-12 md:w-12 transition-all duration-200 hover:scale-105 shadow-lg ${
            isAudioEnabled
              ? "bg-gray-700/80 hover:bg-gray-600/80 text-white"
              : "bg-red-500/80 hover:bg-red-600/80 text-white"
          } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          onClick={onToggleAudio}
          disabled={isEndingCall || isCallEnded}
        >
          {isAudioEnabled ? (
            <Mic className="h-4 w-4 md:h-5 md:w-5" />
          ) : (
            <MicOff className="h-4 w-4 md:h-5 md:w-5" />
          )}
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className={`rounded-full h-10 w-10 md:h-12 md:w-12 transition-all duration-200 hover:scale-105 shadow-lg ${
            isVideoEnabled
              ? "bg-gray-700/80 hover:bg-gray-600/80 text-white"
              : "bg-red-500/80 hover:bg-red-600/80 text-white"
          } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          onClick={onToggleVideo}
          disabled={isEndingCall || isCallEnded}
        >
          {isVideoEnabled ? (
            <Video className="h-4 w-4 md:h-5 md:w-5" />
          ) : (
            <VideoOff className="h-4 w-4 md:h-5 md:w-5" />
          )}
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="rounded-full h-10 w-10 md:h-12 md:w-12 bg-gray-700/80 hover:bg-gray-600/80 text-white transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          onClick={onOpenSettings}
          disabled={isEndingCall || isCallEnded}
        >
          <Settings className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
      </div>
    </div>
  );
}
