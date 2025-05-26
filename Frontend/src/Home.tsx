import { useState, useEffect } from "react";
import StartScreen from "@/components/start-screen";
import MeetingScreen from "@/components/meeting-screen";
import ThankYouScreen from "@/components/thank-you-screen";
import axios from "axios";

export default function Home() {
  const [currentView, setCurrentView] = useState<
    "start" | "meeting" | "thankyou"
  >("start");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [userName, setUserName] = useState("You");

  //   setUserName("You"); // Set default user name
  useEffect(() => {
    setUserName("You");
  }, []);

  // Clean up media stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const handleStart = async () => {
    try {
      const response = await axios.post("http://localhost:8000/start-call");

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);
        setCurrentView("meeting");
      } catch (error) {
        console.error("Error accessing media devices:", error);
        // Show an alert to the user
        alert(
          "Unable to access camera or microphone. Please check your permissions and try again."
        );
        // Still proceed to meeting view even if permissions are denied
        setCurrentView("meeting");
      }

      console.log("Call ended successfully:", response.data);
    } catch (error) {
      console.error("Error ending call:", error);
    }
  };

  const handleEndCall = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setCurrentView("thankyou");
  };

  return (
    <main className="min-h-screen bg-[#0f1624] text-white flex flex-col items-center justify-center">
      {currentView === "start" && <StartScreen onStart={handleStart} />}

      {currentView === "meeting" && (
        <MeetingScreen
          stream={stream}
          userName={userName}
          onEndCall={handleEndCall}
        />
      )}

      {currentView === "thankyou" && <ThankYouScreen />}
    </main>
  );
}
