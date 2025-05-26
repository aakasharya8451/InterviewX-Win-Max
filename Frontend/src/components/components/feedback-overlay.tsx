"use client";

import { Button } from "@/components/ui/button";
import { Star, Loader2 } from "lucide-react";

interface FeedbackOverlayProps {
  isVisible: boolean;
  isLoadingReport: boolean;
  reportRating: number | null;
  onExit: () => void;
  isExiting: boolean;
}

export function FeedbackOverlay({
  isVisible,
  isLoadingReport,
  reportRating,
  onExit,
  isExiting,
}: FeedbackOverlayProps) {
  if (!isVisible) return null;

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

  return (
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
                Processing your interview results...
              </p>
              <p className="text-sm text-gray-400">This may take a moment</p>
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
            onClick={onExit}
            className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isExiting}
          >
            {isExiting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exiting...
              </>
            ) : (
              "Exit"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
