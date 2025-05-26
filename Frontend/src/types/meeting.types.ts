export interface MeetingScreenProps {
  stream: MediaStream | null;
  userName: string;
  onEndCall: () => void;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected";

export interface AudioDeviceState {
  audioInputDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
  selectedAudioInputId: string;
  selectedAudioOutputId: string;
}

export interface MeetingState {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isSettingsOpen: boolean;
  connectionStatus: ConnectionStatus;
  isRemoteAudioPlaying: boolean;
  isCallEnded: boolean;
  showFeedbackOverlay: boolean;
  isLoadingReport: boolean;
  reportRating: number | null;
  isEndingCall: boolean;
  isExiting: boolean;
}

export interface WebSocketRefs {
  audioOutWs: WebSocket | null;
  audioInSocket: WebSocket | null;
  audioCtx: AudioContext | null;
  audioContextIn: AudioContext | null;
  processorIn: ScriptProcessorNode | null;
  bufferQueue: AudioBuffer[];
  isPlaying: boolean;
  isMicMuted: boolean;
  reportPolling: NodeJS.Timeout | null;
  micStream: MediaStream | null;
  currentAudioSource: AudioBufferSourceNode | null;
}
