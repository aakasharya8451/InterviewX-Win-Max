"use client";

import type { ConnectionStatus } from "@/types/meeting.types";

interface ConnectionStatusProps {
  status: ConnectionStatus;
}

export function ConnectionStatusIndicator({ status }: ConnectionStatusProps) {
  const getConnectionColor = () => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
      default:
        return "bg-orange-500";
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      <div
        className={`w-2 h-2 ${getConnectionColor()} rounded-full animate-pulse`}
      ></div>
      <span
        className={`font-medium ${
          status === "connected" ? "text-green-400" : "text-orange-400"
        }`}
      >
        {status === "connected" ? "Connected" : "Connecting..."}
      </span>
    </div>
  );
}
