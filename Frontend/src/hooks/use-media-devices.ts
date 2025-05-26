/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import type { AudioDeviceState } from "@/types/meeting.types";

export function useMediaDevices(stream: MediaStream | null) {
  const [deviceState, setDeviceState] = useState<AudioDeviceState>({
    audioInputDevices: [],
    audioOutputDevices: [],
    selectedAudioInputId: "",
    selectedAudioOutputId: "",
  });

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

        setDeviceState((prev) => ({
          ...prev,
          audioInputDevices: audioInputs,
          audioOutputDevices: audioOutputs,
          selectedAudioInputId:
            prev.selectedAudioInputId || audioInputs[0]?.deviceId || "",
          selectedAudioOutputId:
            prev.selectedAudioOutputId || audioOutputs[0]?.deviceId || "",
        }));
      } catch (error) {
        console.error("Error getting media devices:", error);
      }
    }

    getDevices();
    navigator.mediaDevices.addEventListener("devicechange", getDevices);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", getDevices);
    };
  }, [stream]);

  const switchAudioInput = async (
    deviceId: string,
    stream: MediaStream | null,
    isVideoEnabled: boolean,
    isAudioEnabled: boolean
  ) => {
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

      setDeviceState((prev) => ({ ...prev, selectedAudioInputId: deviceId }));
    } catch (error) {
      console.error("Error switching audio input:", error);
    }
  };

  const switchAudioOutput = async (
    deviceId: string,
    videoElement: HTMLVideoElement | null
  ) => {
    try {
      if (videoElement && "setSinkId" in videoElement) {
        await (videoElement as any).setSinkId(deviceId);
        setDeviceState((prev) => ({
          ...prev,
          selectedAudioOutputId: deviceId,
        }));
      }
    } catch (error) {
      console.error("Error switching audio output:", error);
    }
  };

  return {
    ...deviceState,
    switchAudioInput,
    switchAudioOutput,
  };
}
