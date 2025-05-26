"use client"

import { Button } from "@/components/ui/button"

interface StartScreenProps {
  onStart: () => void
}

export default function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 p-6 max-w-md text-center relative">
      {/* Background decorative elements */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-32 h-32 bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-full blur-3xl"></div>

      {/* Main content */}
      <div className="relative z-10 space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            Video Conference
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
        </div>

        <p className="text-gray-300 text-lg leading-relaxed max-w-sm mx-auto">
          Click the start button to join the meeting. This will request permission to access your camera and microphone.
        </p>

        <Button
          onClick={onStart}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-12 py-6 text-xl rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 border border-blue-500/20 backdrop-blur-sm"
        >
          <span className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            Start Meeting
          </span>
        </Button>
      </div>
    </div>
  )
}
